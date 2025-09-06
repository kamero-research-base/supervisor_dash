import { NextRequest, NextResponse } from 'next/server';
import client from "../../utils/db"; // Adjust the path to your database client

export async function POST(req: NextRequest): Promise<NextResponse> {
    let requestBody;
      
      try {
          requestBody = await req.json();
      } catch (error) {
          return NextResponse.json({ message: "Invalid JSON format in request." }, { status: 400 });
      }
      const {id, supervisor_id} = requestBody;

      if (!id) {
          return NextResponse.json({ message: "Research ID is required." }, { status: 400 });
      }

    try {
      // If supervisor_id is provided, verify they have access to this research
      if (supervisor_id) {
        // First get the students assigned to this supervisor
        const supervisorQuery = `SELECT id FROM students WHERE supervisor_id = $1;`;
        const studentsResult = await client.query(supervisorQuery, [supervisor_id]);
        const studentIds = studentsResult.rows.map((student: any) => student.id.toString());

        if (studentIds.length === 0) {
          return NextResponse.json({ message: "No students assigned to this supervisor." }, { status: 403 });
        }

        // Check if the research belongs to one of the supervisor's students
        const accessQuery = `SELECT user_id FROM researches WHERE CAST(id AS TEXT) = $1`;
        const accessResult = await client.query(accessQuery, [id]);
        
        if (accessResult.rows.length === 0) {
          return NextResponse.json({ message: "Research not found." }, { status: 404 });
        }

        const researchOwnerId = accessResult.rows[0].user_id;
        if (!studentIds.includes(researchOwnerId)) {
          return NextResponse.json({ message: "Access denied. This research does not belong to your assigned students." }, { status: 403 });
        }
      }

      // First try to get basic research data
      let query = `SELECT 
      r.id,
      r.title,
      r.researcher,
      r.status,
      r.progress_status,
      r.year,
      r.abstract,
      r.document,
      r.document_type,
      r.url,
      r.category,
      r.hashed_id,
      r.is_public,
      r.created_at,
      r.user_id,
      i.name AS institute,
      s.name AS school
      FROM researches r
      JOIN institutions i ON CAST(i.id AS TEXT) = r.institution
      JOIN schools s ON CAST(s.id AS TEXT) = r.school
      WHERE CAST(r.id AS TEXT) = $1 
      `;
   
        const researchResult = await client.query(query, [id]);

        if (researchResult.rows.length === 0) {
            return NextResponse.json({ message: "Research not found." }, { status: 404 });
        }

        let researchData = researchResult.rows[0];
        
        // Add author_name field for compatibility
        researchData.author_name = researchData.researcher;

        // Try to get revocation data separately (in case columns don't exist)
        try {
          const revocationQuery = `
            SELECT 
              r.revoke_approval_reason, 
              r.approval_revoked_at, 
              r.revoker_supervisor_id,
              CONCAT(s1.first_name, ' ', s1.last_name) as revoker_supervisor_name,
              r.rejection_reason,
              r.rejected_at,
              r.rejected_by_id,
              CONCAT(s2.first_name, ' ', s2.last_name) as rejected_by_supervisor_name,
              r.unreject_reason,
              r.unrejected_at,
              r.unrejected_by_id,
              CONCAT(s3.first_name, ' ', s3.last_name) as unrejected_by_supervisor_name
            FROM researches r
            LEFT JOIN supervisors s1 ON s1.id = r.revoker_supervisor_id
            LEFT JOIN supervisors s2 ON s2.id = r.rejected_by_id
            LEFT JOIN supervisors s3 ON s3.id = r.unrejected_by_id
            WHERE CAST(r.id AS TEXT) = $1
          `;
          const revocationResult = await client.query(revocationQuery, [id]);
          if (revocationResult.rows.length > 0) {
            researchData.revoke_approval_reason = revocationResult.rows[0].revoke_approval_reason;
            researchData.approval_revoked_at = revocationResult.rows[0].approval_revoked_at;
            researchData.revoker_supervisor_id = revocationResult.rows[0].revoker_supervisor_id;
            researchData.revoker_supervisor_name = revocationResult.rows[0].revoker_supervisor_name;
            researchData.rejection_reason = revocationResult.rows[0].rejection_reason;
            researchData.rejected_at = revocationResult.rows[0].rejected_at;
            researchData.rejected_by_id = revocationResult.rows[0].rejected_by_id;
            researchData.rejected_by_supervisor_name = revocationResult.rows[0].rejected_by_supervisor_name;
            researchData.unreject_reason = revocationResult.rows[0].unreject_reason;
            researchData.unrejected_at = revocationResult.rows[0].unrejected_at;
            researchData.unrejected_by_id = revocationResult.rows[0].unrejected_by_id;
            researchData.unrejected_by_supervisor_name = revocationResult.rows[0].unrejected_by_supervisor_name;
          }
        } catch (revocationError) {
          // Revocation columns don't exist yet - that's okay
          console.log('Revocation columns not found, skipping...');
          researchData.revoke_approval_reason = null;
          researchData.approval_revoked_at = null;
          researchData.revoker_supervisor_id = null;
          researchData.revoker_supervisor_name = null;
          researchData.rejection_reason = null;
          researchData.rejected_at = null;
          researchData.rejected_by_id = null;
          researchData.rejected_by_supervisor_name = null;
          researchData.unreject_reason = null;
          researchData.unrejected_at = null;
          researchData.unrejected_by_id = null;
          researchData.unrejected_by_supervisor_name = null;
        }

        return NextResponse.json(researchData, { status: 200 });
    } catch (error) {
        console.error("Error retrieving research:", error);
        return NextResponse.json({ message: "Error retrieving Research", error: (error as Error).message }, { status: 500 });
    }
}
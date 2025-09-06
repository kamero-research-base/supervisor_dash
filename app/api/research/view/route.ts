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

      // MODIFIED: Added r.is_public to the SELECT statement
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

        return NextResponse.json(researchResult.rows[0], { status: 200 });
    } catch (error) {
        console.error("Error retrieving research:", error);
        return NextResponse.json({ message: "Error retrieving Research", error: (error as Error).message }, { status: 500 });
    }
}
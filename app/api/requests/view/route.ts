import { NextRequest, NextResponse } from 'next/server';
import client from "../../utils/db"; // Adjust the path to your database client

export async function POST(req: NextRequest): Promise<NextResponse> {
    let requestBody;
      
      // Safe JSON parsing
      try {
          requestBody = await req.json();
      } catch (error) {
          return NextResponse.json({ message: "Invalid JSON format in request." }, { status: 400 });
      }
      const {id} = requestBody;
      
      if (!id) {
          return NextResponse.json({ message: "Research ID is required." }, { status: 400 });
      }

    try {
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
      r.category,
      rs.hashed_id,
      r.created_at,
      r.content,
      rs.approval_requested,
      i.name AS institute,
      i.id AS institute_if,
      s.id AS school_id,
      s.name AS school,
      st.first_name,
      st.last_name
      FROM research_changes r
      JOIN researches rs ON rs.id = r.research_id
      JOIN institutions i ON CAST(i.id AS TEXT) = rs.institution
      JOIN schools s ON CAST(s.id AS TEXT) = rs.school
      JOIN students st ON st.id = r.changed_by
      WHERE r.id = $1 
      `;
   
        // Fetch Research details
        const researchResult = await client.query(query, [id]);

        if (researchResult.rows.length === 0) {
            return NextResponse.json({ message: "Research not found." }, { status: 401 });
        }

        return NextResponse.json(researchResult.rows[0], { status: 200 });
    } catch (error) {
        console.error("Error retrieving research:", error);
        return NextResponse.json({ message: "Error retrieving Research", error: (error as Error).message }, { status: 500 });
    }
}

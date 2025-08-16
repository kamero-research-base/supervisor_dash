import { NextRequest, NextResponse } from 'next/server';
import client from "../../utils/db"; // Adjust the path to your database client

export async function POST(req: NextRequest): Promise<NextResponse> {
    let requestBody;
      
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
      i.name AS institute,
      s.name AS school
      FROM researches r
      JOIN institutions i ON CAST(i.id AS TEXT) = r.institution
      JOIN schools s ON CAST(s.id AS TEXT) = r.school
      WHERE r.hashed_id = $1 
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
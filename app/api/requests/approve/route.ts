import { NextRequest, NextResponse } from 'next/server';
import client from "../../utils/db"; // Adjust the path to your database client

export async function PUT(req: NextRequest): Promise<NextResponse> {
    let requestBody;
    
    try {
        requestBody = await req.json();
        console.log("Received body:", requestBody);
    } catch (error) {
        return NextResponse.json({ message: "Invalid JSON format in request." }, { status: 400 });
    }

    const { change_id, supervisor_id } = requestBody;

    if (!change_id || !supervisor_id) {
        return NextResponse.json({ message: "Missing required fields." }, { status: 401 });
    }

    try{
      // Fetch proposed changes
      
      const changeResult = await client.query("SELECT * FROM research_changes WHERE id = $1", [change_id]);
      const change = changeResult.rows[0];
  
      if (!change) return NextResponse.json({ message: "Change request not found" }, {status: 400});
  
        // Merge changes into research_uploads
        await client.query(
          `UPDATE researches
           SET title=$1, researcher=$2, institution=$3, school=$4, year=$5, abstract=$6, progress_status=$7, document=$8, document_type=$9, category=$10, status='Approved', approved_by=$11, approval_requested=FALSE
           WHERE id=$12`,
          [change.title, change.researcher, change.institution, change.school, change.year, change.abstract, change.progress_status, change.document, change.document_type, change.category, supervisor_id, change.research_id]
        );
  
       /* // Log in research history
        await client.query(
          `INSERT INTO research_history (research_id, details, supervisor)
           VALUES ($1, 'Research approved by supervisor ID ' || $2)`,
          [change.research_id, supervisor_id]
        );
      */
  

        return NextResponse.json({message:"Changes approved"}, { status: 200 });
    } catch (error) {
        console.error("Error retrieving research:", error);
        return NextResponse.json({ message: "Error approving request", error: (error as Error).message }, { status: 500 });
    }
}

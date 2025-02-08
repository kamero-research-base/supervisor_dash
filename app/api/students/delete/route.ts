import { NextRequest, NextResponse } from 'next/server';
import client from "../../utils/db"; // Adjust the path to your database client

export async function DELETE(req: NextRequest): Promise<NextResponse> {
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
      let query = `DELETE FROM students WHERE id = $1`;
   
        // Fetch Research details
        const researchResult = await client.query(query, [id]);

        if(!researchResult) return NextResponse.json("ID not found", {status: 401});

        return NextResponse.json("Deleted successfully!", { status: 200 });
    } catch (error) {
        console.error("Error deleting research:", error);
        return NextResponse.json({ message: "Error deleting Research", error: (error as Error).message }, { status: 500 });
    }
}

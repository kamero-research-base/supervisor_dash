import { NextRequest, NextResponse } from 'next/server';
import client from "../../utils/db";

export async function PUT(req: NextRequest): Promise<NextResponse> {
    let requestBody;
      
    // Safe JSON parsing
    try {
        requestBody = await req.json();
    } catch (error) {
        return NextResponse.json({ message: "Invalid JSON format in request." }, { status: 400 });
    }
    
    const {id, reason, supervisor_id} = requestBody;
    
    if (!id) {
        return NextResponse.json({ message: "Research ID is required." }, { status: 400 });
    }

    try {
        let query = `UPDATE researches SET status = 'Pending', unreject_reason = $2, unrejected_at = NOW(), unrejected_by_id = $3 WHERE hashed_id = $1 RETURNING id`;
   
        // Update research status back to pending with unreject reason
        const researchResult = await client.query(query, [id, reason || null, supervisor_id || null]);

        if (researchResult.rows.length === 0) {
            return NextResponse.json({ message: "Research not found." }, { status: 404 });
        }

        return NextResponse.json({ 
            message: "Research rejection reversed successfully",
            research_id: researchResult.rows[0].id 
        }, { status: 200 });
    } catch (error) {
        console.error("Error reversing rejection:", error);
        return NextResponse.json({ 
            message: "Error reversing rejection", 
            error: (error as Error).message 
        }, { status: 500 });
    }
}
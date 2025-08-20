
// 6. FETCH USER RESEARCHES - /api/students/researches/route.ts
import { NextRequest, NextResponse } from 'next/server';
import client from "../../utils/db";

export async function POST(req: NextRequest): Promise<NextResponse> {
    let requestBody;
    
    try {
        requestBody = await req.json();
    } catch (error) {
        return NextResponse.json({ message: "Invalid JSON format in request." }, { status: 400 });
    }
    
    const { userId, limit = 10, offset = 0, status = null } = requestBody;
    
    if (!userId) {
        return NextResponse.json({ message: "User ID is required." }, { status: 400 });
    }

    try {
        
        // Build research query
        let researchQuery = `
            SELECT 
                r.id,
                r.title,
                r.status,
                r.progress_status as status,
                r.category,
                r.year,
                r.abstract,
                r.created_at,
                r.hashed_id,
                i.name as institute,
                s.name as school
            FROM researches r
            LEFT JOIN institutions i ON CAST(i.id AS TEXT) = r.institution
            LEFT JOIN schools s ON CAST(s.id AS TEXT) = r.school
            WHERE CAST(r.user_id AS INTEGER) = $1
        `;
        
        const queryParams = [userId];
        
        // Add status filter if provided
        if (status) {
            researchQuery += ` AND r.progress_status = $${queryParams.length + 1}`;
            queryParams.push(status);
        }
        
        // Add ordering and pagination
        researchQuery += ` ORDER BY r.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        queryParams.push(limit, offset);
        
        // Fetch researches
        const researchResult = await client.query(researchQuery, queryParams);
        
        // Get total count
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM researches 
            WHERE user_id = $1
        `;
        const countParams = [userId];
        
        if (status) {
            countQuery += ` AND progress_status = $2`;
            countParams.push(status);
        }
        
        const countResult = await client.query(countQuery, countParams);
        const totalCount = parseInt(countResult.rows[0].total);
       
        return NextResponse.json({
            researches: researchResult.rows,
            total: totalCount,
            limit: limit,
            offset: offset
        }, { status: 200 });
    } catch (error) {
        console.error("Error fetching user researches:", error);
        return NextResponse.json({ message: "Error fetching researches", error: (error as Error).message }, { status: 500 });
    }
}
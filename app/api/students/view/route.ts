
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
    
    const { id } = requestBody;
    
    if (!id) {
        return NextResponse.json({ message: "User ID is required." }, { status: 400 });
    }

    try {
        const query = `
            SELECT 
                first_name,
                last_name,
                email,
                students.status,
                phone,
                departments.name AS department,
                unique_id,
                profile_picture,
                students.created_at,
                students.updated_at
            FROM students
            JOIN departments ON CAST(students.department AS INTEGER) = departments.id
            WHERE unique_id = $1 OR CAST(students.id AS TEXT) = $1
        `;
        
        // Fetch user details
        const userResult = await client.query(query, [id]);

        if (userResult.rows.length === 0) {
            return NextResponse.json({ message: "User not found." }, { status: 404 });
        }

        return NextResponse.json(userResult.rows[0], { status: 200 });
    } catch (error) {
        console.error("Error retrieving user:", error);
        return NextResponse.json({ message: "Error retrieving user", error: (error as Error).message }, { status: 500 });
    }
}

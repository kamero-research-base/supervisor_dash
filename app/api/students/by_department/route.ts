// ===== /api/supervisors/students/route.ts =====
import { NextRequest, NextResponse } from 'next/server';
import client from "../../utils/db";

export async function POST(req: NextRequest): Promise<NextResponse> {
    let requestBody;
    
    try {
        requestBody = await req.json();
    } catch (error) {
        return NextResponse.json({ message: "Invalid JSON format in request." }, { status: 400 });
    }
    
    const { departmentId } = requestBody;

    if (!departmentId) {
        return NextResponse.json({ message: "Department ID is required." }, { status: 400 });
    }

    try {
        const query = `
            SELECT 
                students.id,
                students.first_name,
                students.last_name,
                students.email,
                students.status,
                students.phone,
                departments.name AS department,
                students.unique_id,
                students.profile_picture,
                students.created_at
            FROM students
            JOIN departments ON CAST(students.department AS INTEGER) = departments.id
            WHERE students.department = $1
        `;
        
        const studentsResult = await client.query(query, [departmentId]);

        return NextResponse.json({ students: studentsResult.rows }, { status: 200 });
    } catch (error) {
        console.error("Error retrieving students:", error);
        return NextResponse.json({ message: "Error retrieving students", error: (error as Error).message }, { status: 500 });
    }
}
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import client from "../utils/db"; // Adjust the path as needed

export async function POST(req: Request) {
  try {
    const formData = await req.json();
    const { supervisor_id } = formData;

    if (!supervisor_id) {
      return NextResponse.json({ message: "Unauthorized access" }, { status: 401 });
    }

    // First, verify supervisor exists
    const supervisorQuery = `SELECT id FROM supervisors WHERE id = $1;`;
    const supervisorResult = await client.query(supervisorQuery, [supervisor_id]);
    
    if (supervisorResult.rows.length === 0) {
      return NextResponse.json({ message: "Supervisor not found" }, { status: 404 });
    }

    // Get students assigned to this supervisor using the supervisor_id field in students table
    const studentsQuery = `SELECT id FROM students WHERE supervisor_id = $1;`;
    const studentsResult = await client.query(studentsQuery, [supervisor_id]);
    
    const studentIds = studentsResult.rows.map((student: any) => student.id.toString());
    console.log(`🔍 [RESEARCH API] Supervisor ${supervisor_id} has ${studentIds.length} assigned students:`, studentIds);

    // Handle case where supervisor has no students assigned
    if (!studentIds.length) {
      console.log(`❌ [RESEARCH API] No students found for supervisor ${supervisor_id}`);
      return NextResponse.json([], { status: 200 });
    }

    // Query to get all researches from students only
    const query = `SELECT 
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
      r.is_public,
      r.category,
      r.hashed_id,
      r.created_at,
      r.user_id,
      i.name AS institute,
      s.name AS school
      FROM researches r
      JOIN institutions i ON CAST(i.id AS TEXT) = r.institution
      JOIN schools s ON CAST(s.id AS TEXT) = r.school
      WHERE r.user_id = ANY($1::text[])`;

    const result = await client.query(query, [studentIds]);
    console.log(`✅ [RESEARCH API] Found ${result.rows.length} research materials from students:`, 
      result.rows.map((r: any) => ({ id: r.id, title: r.title, user_id: r.user_id }))
    );

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error("Error retrieving researches:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
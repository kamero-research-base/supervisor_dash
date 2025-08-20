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

    // First, get the students array from supervisor table
    const supervisorQuery = `SELECT students FROM supervisors WHERE id = $1;`;
    const supervisorResult = await client.query(supervisorQuery, [supervisor_id]);
    
    if (supervisorResult.rows.length === 0) {
      return NextResponse.json({ message: "Supervisor not found" }, { status: 404 });
    }

    const students = supervisorResult.rows[0].students || [];
    // Create array of all user IDs (supervisor + students)
    const allUserIds = [parseInt(supervisor_id), ...students];

    // Query to get all researches for supervisor and their students
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
      WHERE r.user_id = ANY($1)
      ORDER BY r.id DESC`; // Default ordering by latest first

    const result = await client.query(query, [allUserIds]);

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error("Error retrieving researches:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
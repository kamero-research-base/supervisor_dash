// app/api/students/route.ts

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import client from "../utils/db"; // Adjust path as needed

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const filter = searchParams.get("filter");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort");
    // Renamed variable for clarity
    const department_id = searchParams.get("department_id");

    if (!department_id) {
      // Return empty array or an error if a department context is always required
      return NextResponse.json({ message: "Department ID is required" }, { status: 400 });
    }

    let query = `
      SELECT 
        s.id, s.first_name, s.last_name, s.email, s.phone, s.password,
        s.status, s.created_at, s.hashed_id, s.profile_picture,
        i.name AS institute, c.name AS college,
        sc.name AS school, d.name AS department
      FROM students s
      LEFT JOIN departments d ON CAST(d.id AS TEXT) = s.department
      LEFT JOIN schools sc ON CAST(sc.id AS TEXT) = d.school
      LEFT JOIN colleges c ON CAST(c.id AS TEXT) = sc.college
      LEFT JOIN institutions i ON CAST(i.id AS TEXT) = c.institution
      WHERE s.department = $1
    `;

    const params: any[] = [department_id];
    
    // ... rest of the query building logic remains the same ...

    const result = await client.query(query, params);

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error("Error retrieving students:", error);
    return NextResponse.json({ message: "Server error while retrieving students" }, { status: 500 });
  }
}
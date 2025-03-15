export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import client from "../../utils/db"; // Adjust the path as needed

export async function POST(req: Request) {
  try {
    const formData = await req.json();
    const { department_id } = formData;

    if (!department_id) {
      return NextResponse.json({ message: "Unauthorized access" }, { status: 401 });
    }

    // Query to fetch institution statistics
    const query = `
      SELECT 
        COUNT(*) AS total_students,
        SUM(CASE WHEN s.status = 'Pending' THEN 1 ELSE 0 END) AS total_pending,
        SUM(CASE WHEN s.status = 'Active' THEN 1 ELSE 0 END) AS total_active,
        SUM(CASE WHEN s.status = 'Unverified' THEN 1 ELSE 0 END) AS total_unverified,
        SUM(CASE WHEN s.status IN ('Locked', 'Inactive') THEN 1 ELSE 0 END) AS total_inactive
      FROM students s
      WHERE s.department = $1
    `;

    // Execute the query
    const result = await client.query(query, [department_id]);

    // Extract data
    const data = result.rows[0] || {};

    // Prepare response
    const response = {
      total_students: Number(data.total_students) || 0,
      total_active: Number(data.total_active) || 0,
      total_pending: Number(data.total_pending) || 0,
      total_unverified: Number(data.total_unverified) || 0,
      total_inactive: Number(data.total_inactive) || 0,
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error("Error retrieving institution analytics:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

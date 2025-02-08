export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import client from "../../utils/db"; // Adjust the path as needed

export async function POST(req: Request) {
  try {
    const formData = await req.json();
    const { school_id } = formData;

    if (!school_id) {
      return NextResponse.json({ message: "Unauthorized access" }, { status: 401 });
    }

    // Query to fetch institution statistics
    const query = `
      SELECT 
        COUNT(*) AS total_departments,
        SUM(CASE WHEN d.status = 'Pending' THEN 1 ELSE 0 END) AS total_pending,
        SUM(CASE WHEN d.status = 'Active' THEN 1 ELSE 0 END) AS total_active,
        SUM(CASE WHEN d.status = 'Unverified' THEN 1 ELSE 0 END) AS total_unverified,
        SUM(CASE WHEN d.status IN ('Locked', 'Inactive') THEN 1 ELSE 0 END) AS total_inactive
      FROM departments d
      WHERE d.school = $1
    `;

    // Execute the query
    const result = await client.query(query, [school_id]);

    // Extract data
    const data = result.rows[0] || {};

    // Prepare response
    const response = {
      total_departments: Number(data.total_departments) || 0,
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

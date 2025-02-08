export const dynamic = "force-dynamic";



import { NextResponse } from "next/server";
import client from "../utils/db"; // Adjust the path as needed

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const school_id = searchParams.get("school_id");

    let query = `SELECT 
      d.id,
      d.name,
      d.label,
      d.status,
      d.created_at,
      i.name AS institute,
      c.name AS college,
      s.name AS school
      FROM departments d
      JOIN schools s ON CAST(s.id AS TEXT) = $1
      JOIN colleges c ON c.id = s.id
      JOIN institutions i ON i.id = c.id 
      WHERE d.school = $1 ORDER BY id ASC
      
      `;

    const result = await client.query(query, [school_id]);

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error("Error retrieving departments:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

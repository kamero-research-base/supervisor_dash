export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import client from "../../../utils/db"; // Adjust the path as needed

export async function GET() {
  try {
    // Method 1: Using ANY operator (recommended)
    let query = `SELECT 
      r.researcher,
      i.name AS institute,
      s.name AS school
      FROM researches r
      JOIN institutions i ON CAST(i.id AS TEXT) = r.institution
      JOIN schools s ON CAST(s.id AS TEXT) = r.school
      WHERE r.researcher != ''`; // Filter by user_id (session_id)

    const result = await client.query(query);

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error("Error retrieving researches:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
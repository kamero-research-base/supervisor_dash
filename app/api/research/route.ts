export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import client from "../utils/db"; // Adjust the path as needed

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // Extract query parameters
    const filter = searchParams.get("filter");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort");
    const sessionId = searchParams.get("department_id"); // Get session_id
    console.log(sessionId)
    if (!sessionId) {
      return NextResponse.json({ message: "Unauthorized access" }, { status: 401 });
    }

    let query = `SELECT 
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
      r.category,
      r.hashed_id,
      r.created_at,
      i.name AS institute,
      s.name AS school
      FROM researches r
      JOIN institutions i ON CAST(i.id AS TEXT) = r.institution
      JOIN schools s ON CAST(s.id AS TEXT) = r.school
      WHERE r.department = $1`; // Filter by school_id (session_id)

    const params: any[] = [sessionId];
    const conditions = [];

    if (filter) {
      conditions.push(` r.status = $${params.length + 1}`);
      params.push(filter);
    }
    if (search) {
      conditions.push(`(r.title ILIKE $${params.length + 1} OR r.researcher ILIKE $${params.length + 1} OR r.school ILIKE $${params.length + 1} OR r.url ILIKE $${params.length + 1} OR r.category ILIKE $${params.length + 1} OR r.year ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    if (conditions.length) {
      query += ` AND ${conditions.join(" AND ")}`;
    }

    // Sorting
    if (sort) {
      if (sort === "new") {
        query += " ORDER BY CAST(r.created_at AS DATE) DESC";
      } else if (sort === "old") {
        query += " ORDER BY CAST(r.created_at AS DATE) ASC";
      } else if (sort === "title") {
        query += " ORDER BY r.title ASC";
      }
    } else {
      query += " ORDER BY r.id DESC";
    }

    const result = await client.query(query, params);

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error("Error retrieving researches:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

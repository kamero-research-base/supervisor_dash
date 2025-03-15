export const dynamic = "force-dynamic";


import { NextResponse } from 'next/server';
import client from "../utils/db"; // Adjust the path to your database client

export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);

  // Extract query parameters
  const filter = searchParams.get("filter");
  const search = searchParams.get("search");
  const sort = searchParams.get("sort");
  const sessionId = searchParams.get("department_id"); // Get session_id

  if (!sessionId) {
    return NextResponse.json({ message: "Unauthorized access" }, { status: 401 });
  }
    try {
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
      r.category,
      rs.hashed_id,
      r.created_at,
      r.content,
      rs.approval_requested,
      i.name AS institute,
      i.id AS institute_if,
      s.id AS school_id,
      s.name AS school,
      st.first_name,
      st.last_name
      FROM research_changes r
      JOIN researches rs ON rs.id = r.research_id
      JOIN institutions i ON CAST(i.id AS TEXT) = rs.institution
      JOIN schools s ON CAST(s.id AS TEXT) = rs.school
      JOIN students st ON st.id = r.changed_by
      WHERE rs.department = $1 
      `;
      const params: any[] = [sessionId];
      const conditions = [];
  
      if (filter) {
        conditions.push(` r.status = $${params.length + 1}`);
        params.push(filter);
      }
      if (search) {
        conditions.push(`(r.title ILIKE $${params.length + 1} OR r.researcher ILIKE $${params.length + 1} OR rs.url ILIKE $${params.length + 1} OR r.category ILIKE $${params.length + 1} OR CAST(r.year AS TEXT) ILIKE $${params.length + 1})`);
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
  
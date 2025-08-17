export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import client from "../utils/db"; // Adjust the path

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const filter = searchParams.get("filter");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort");
    const school_id = searchParams.get("school_id");

    let query = `
      SELECT 
        d.id,
        d.name,
        d.label,
        d.status,
        d.created_at,
        d.school,
        COALESCE(i.name, 'Unknown Institute') AS institute,
        COALESCE(c.name, 'Unknown College') AS college,
        COALESCE(s.name, 'Unknown School') AS school_name
      FROM departments d
      LEFT JOIN schools s ON CAST(s.id AS TEXT) = CAST(d.school AS TEXT)
      LEFT JOIN colleges c ON CAST(c.id AS TEXT) = s.college
      LEFT JOIN institutions i ON CAST(i.id AS TEXT) = c.institution
      WHERE 1=1
    `;

    const params: any[] = [];
    const conditions: string[] = [];

    // Filter by school_id if provided
    if (school_id && school_id.trim() !== '') {
      conditions.push(`CAST(d.school AS TEXT) = $${params.length + 1}`);
      params.push(school_id.trim());
    }

    if (filter && filter.trim() !== '') {
      conditions.push(`d.status = $${params.length + 1}`);
      params.push(filter.trim());
    }

    if (search && search.trim() !== '') {
      const searchParam = `%${search.trim()}%`;
      const idx = params.length + 1;
      conditions.push(`
        (d.name ILIKE $${idx} 
        OR d.label ILIKE $${idx} 
        OR COALESCE(d.hashed_id, '') ILIKE $${idx})
      `);
      params.push(searchParam);
    }

    if (conditions.length > 0) {
      query += ` AND ${conditions.join(" AND ")}`;
    }

    // Sorting
    if (sort) {
      if (sort === "new") query += " ORDER BY d.created_at DESC";
      else if (sort === "old") query += " ORDER BY d.created_at ASC";
      else if (sort === "name") query += " ORDER BY d.name ASC";
    } else {
      query += " ORDER BY d.id DESC";
    }

    const result = await client.query(query, params);

    // Always return an array
    const formattedDepartments = (result.rows || []).map((dept: any) => ({
      id: dept.id,
      name: dept.name || dept.label,
      school: dept.school_name || `School ${dept.school}`,
      institute: dept.institute,
      college: dept.college,
      label: dept.label,
      status: dept.status,
      created_at: dept.created_at
    }));

    return NextResponse.json(formattedDepartments, { status: 200 });

  } catch (error) {
    console.error("Error retrieving departments:", error);
    return NextResponse.json(
      { message: "Failed to retrieve departments", error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

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
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");
    const supervisor_id = searchParams.get("supervisor_id");

    if (!supervisor_id) {
      return NextResponse.json({ message: "supervisor ID is required" }, { status: 400 });
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
      WHERE s.supervisor_id = $1
    `;

    const params: any[] = [supervisor_id];
    let paramCount = 1;

    // Add search functionality
    if (search && search.trim()) {
      paramCount++;
      query += ` AND (
        LOWER(s.first_name) LIKE LOWER($${paramCount}) OR 
        LOWER(s.last_name) LIKE LOWER($${paramCount}) OR 
        LOWER(s.email) LIKE LOWER($${paramCount}) OR
        LOWER(CONCAT(s.first_name, ' ', s.last_name)) LIKE LOWER($${paramCount})
      )`;
      params.push(`%${search.trim()}%`);
    }

    // Add status filter
    if (filter && filter.trim()) {
      paramCount++;
      query += ` AND s.status = $${paramCount}`;
      params.push(filter.trim());
    }

    // Add sorting
    if (sort && sort.trim()) {
      const sortOptions: Record<string, string> = {
        'first_name_asc': 'ORDER BY s.first_name ASC',
        'first_name_desc': 'ORDER BY s.first_name DESC',
        'last_name_asc': 'ORDER BY s.last_name ASC',
        'last_name_desc': 'ORDER BY s.last_name DESC',
        'email_asc': 'ORDER BY s.email ASC',
        'email_desc': 'ORDER BY s.email DESC',
        'created_at_asc': 'ORDER BY s.created_at ASC',
        'created_at_desc': 'ORDER BY s.created_at DESC',
        'status_asc': 'ORDER BY s.status ASC',
        'status_desc': 'ORDER BY s.status DESC',
      };

      if (sortOptions[sort.trim()]) {
        query += ` ${sortOptions[sort.trim()]}`;
      } else {
        query += " ORDER BY s.created_at DESC";
      }
    } else {
      query += " ORDER BY s.created_at DESC";
    }

    // Add pagination
    if (page && limit) {
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);

      if (!isNaN(pageNum) && !isNaN(limitNum) && pageNum > 0 && limitNum > 0) {
        const offset = (pageNum - 1) * limitNum;
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(limitNum);

        paramCount++;
        query += ` OFFSET $${paramCount}`;
        params.push(offset);
      }
    }

    const result = await client.query(query, params);

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error("Error retrieving students:", error);
    return NextResponse.json({ message: "Server error while retrieving students" }, { status: 500 });
  }
}
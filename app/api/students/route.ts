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
    const school_id = searchParams.get("school_id");

    if (!school_id) {
      return NextResponse.json({ message: "No authorized access" }, { status: 400 });
    }

    let query = `
      SELECT 
        s.id,
        s.first_name,
        s.last_name,
        s.email,
        s.phone,
        s.password,
        s.status,
        s.created_at,
        s.hashed_id,
        s.profile_picture,
        i.name AS institute,
        c.name AS college,
        sc.name AS school,
        d.name AS department
      FROM students s
      JOIN departments d ON CAST(d.id AS TEXT) = CAST(s.department AS TEXT)
      JOIN schools sc ON CAST(sc.id AS TEXT) = CAST(d.school AS TEXT)
      JOIN colleges c ON CAST(c.id AS TEXT) = CAST(sc.college AS TEXT)
      JOIN institutions i ON CAST(i.id AS TEXT) = CAST(c.institution AS TEXT)
      WHERE CAST(sc.id AS TEXT) = $1
    `;

    const params: any[] = [school_id];

    const conditions = [];
    if (filter) {
      conditions.push(`s.status = $${params.length + 1}`);
      params.push(filter);
    }
    if (search) {
      conditions.push(
        `(s.verification_code ILIKE $${params.length + 1} OR 
          s.first_name ILIKE $${params.length + 1} OR 
          s.last_name ILIKE $${params.length + 1} OR 
          s.email ILIKE $${params.length + 1} OR 
          s.status ILIKE $${params.length + 1})`
      );
      params.push(`%${search}%`);
    }

    if (conditions.length) {
      query += ` AND ${conditions.join(" AND ")}`;
    }

    // Sorting
    if (sort) {
      if (sort === "new") {
        query += " ORDER BY s.created_at DESC";
      } else if (sort === "old") {
        query += " ORDER BY s.created_at ASC";
      } else if (sort === "name") {
        query += " ORDER BY s.first_name ASC, s.last_name ASC";
      }
    } else {
      query += " ORDER BY s.id DESC";
    }

    const result = await client.query(query, params);

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error("Error retrieving students:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

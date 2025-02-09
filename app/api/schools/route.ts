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

    let query = `SELECT 
      s.id,
      s.name,
      s.address,
      s.status,
      s.contact,
      s.created_at,
      s.logo,
      i.name AS institute,
      c.name AS college
      FROM schools s
      JOIN colleges c ON s.college = CAST(c.id AS TEXT)
      JOIN institutions i ON c.id = CAST(c.institution AS INTEGER) 

      `;
   
    const params: any[] = [];

    const conditions = [];
    if (filter) {
      conditions.push(`s.status = $${params.length + 1}`);
      params.push(filter);
    }
    if (search) {
      conditions.push(`(s.name ILIKE $${params.length + 1} OR s.address ILIKE $${params.length + 1} OR s.label ILIKE $${params.length + 1} OR s.contact ILIKE $${params.length + 1} OR s.hashed_id ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    if (conditions.length) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    // Sorting
    if (sort) {
      if (sort === "new") {
        query += " ORDER BY CAST(s.created_at AS DATE) DESC";
      } else if (sort === "old") {
        query += " ORDER BY CAST(s.created_at AS DATE) ASC";
      }else if (sort === "name") {
        query += " ORDER BY s.name ASC";
      }
    } else {
      query += " ORDER BY s.id DESC";
    }

    const result = await client.query(query, params);

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error("Error retrieving colleges:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

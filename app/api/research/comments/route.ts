// app/api/research/comments/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import client from "../../utils/db"; // Adjust the path as needed

export async function POST(req: Request) {
  try {
    const { session_id, research_id } = await req.json();

    if (!session_id) {
      return NextResponse.json({ message: "Session ID is required" }, { status: 400 });
    }

    if (!research_id) {
      return NextResponse.json({ message: "Research ID is required" }, { status: 400 });
    }

    // First, get the actual research ID from hashed_id
    const researchQuery = `SELECT id FROM researches WHERE hashed_id = $1`;
    const researchResult = await client.query(researchQuery, [research_id]);

    if (researchResult.rows.length === 0) {
      return NextResponse.json({ message: "Research not found" }, { status: 404 });
    }

    const actualResearchId = researchResult.rows[0].id;

    // Query to get all comments for this research
    // You might want to join with a users table if you have user details
    const query = `
     SELECT 
        c.id,
        c.content,
        c.user_id,
        c.research_id,
        c.parent_id,
        c.identifier,
        c.created_at,
        c.updated_at,
        c.is_edited,
        c.is_deleted,
        u.first_name,
        u.last_name
      FROM comments c
      LEFT JOIN supervisors u ON c.user_id = u.id
      WHERE c.research_id = $1 
      ORDER BY c.created_at ASC
    `;

    const result = await client.query(query, [actualResearchId]);

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// Optional: Add GET method if you want to support query parameters
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const session_id = searchParams.get('session_id');
    const research_id = searchParams.get('research_id');

    if (!session_id) {
      return NextResponse.json({ message: "Session ID is required" }, { status: 400 });
    }

    if (!research_id) {
      return NextResponse.json({ message: "Research ID is required" }, { status: 400 });
    }

    // First, get the actual research ID from hashed_id
    const researchQuery = `SELECT id FROM researches WHERE hashed_id = $1`;
    const researchResult = await client.query(researchQuery, [research_id]);

    if (researchResult.rows.length === 0) {
      return NextResponse.json({ message: "Research not found" }, { status: 404 });
    }

    const actualResearchId = researchResult.rows[0].id;

    const query = `
      SELECT 
        c.id,
        c.content,
        c.user_id,
        c.research_id,
        c.parent_id,
        c.identifier,
        c.created_at,
        c.updated_at,
        c.is_edited,
        c.is_deleted,
        u.first_name,
        u.last_name
      FROM comments c
      LEFT JOIN supervisors u ON c.user_id = u.id
      WHERE c.research_id = $1 
      ORDER BY c.created_at ASC
    `;

    const result = await client.query(query, [actualResearchId]);
    
    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
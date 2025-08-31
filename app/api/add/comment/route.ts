// app/api/research/comments/add/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import client from "../../utils/db"; // Adjust the path as needed

export async function POST(req: Request) {
  try {
    const { content, session_id, research_id, identifier, parent_id } = await req.json();

    // Validate required fields
    if (!content || !content.trim()) {
      return NextResponse.json({ message: "Comment content is required" }, { status: 400 });
    }

    if (!session_id) {
      return NextResponse.json({ message: "Session ID is required" }, { status: 400 });
    }

    if (!research_id) {
      return NextResponse.json({ message: "Research ID is required" }, { status: 400 });
    }

    if (!identifier) {
      return NextResponse.json({ message: "Identifier is required" }, { status: 400 });
    }

    // First, get the actual research ID from hashed_id
    const researchQuery = `SELECT id FROM researches WHERE hashed_id = $1`;
    const researchResult = await client.query(researchQuery, [research_id]);

    if (researchResult.rows.length === 0) {
      return NextResponse.json({ message: "Research not found" }, { status: 404 });
    }

    const actualResearchId = researchResult.rows[0].id;

    // Get user_id from session_id (assuming you have a sessions table or similar)
    // For now, I'll use a placeholder logic - you might need to adjust this based on your auth system
    let user_id;
    
    // Option 1: If session_id is actually the supervisor_id
    if (session_id && !isNaN(parseInt(session_id))) {
      user_id = parseInt(session_id);
    } else {
      // Option 2: If you have a sessions table, query it
      // const sessionQuery = `SELECT user_id FROM sessions WHERE session_id = $1`;
      // const sessionResult = await client.query(sessionQuery, [session_id]);
      // if (sessionResult.rows.length === 0) {
      //   return NextResponse.json({ message: "Invalid session" }, { status: 401 });
      // }
      // user_id = sessionResult.rows[0].user_id;
      
      // For now, using session_id as user_id (adjust based on your system)
      user_id = session_id;
    }

    // Validate parent_id if provided (for threaded comments)
    if (parent_id) {
      const parentQuery = `SELECT id FROM comments WHERE id = $1 AND research_id = $2`;
      const parentResult = await client.query(parentQuery, [parent_id, actualResearchId]);
      
      if (parentResult.rows.length === 0) {
        return NextResponse.json({ message: "Parent comment not found" }, { status: 404 });
      }
    }

    // Insert the new comment
    const insertQuery = `
      INSERT INTO comments (content, user_id, research_id, parent_id, identifier, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, content, user_id, research_id, parent_id, identifier, created_at, updated_at, is_edited, is_deleted
    `;

    const values = [
      content.trim(),
      user_id,
      actualResearchId,
      parent_id || null,
      identifier
    ];

    const result = await client.query(insertQuery, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ message: "Failed to create comment" }, { status: 500 });
    }

    const newComment = result.rows[0];

    return NextResponse.json({
      message: "Comment added successfully",
      comment: newComment
    }, { status: 201 });

  } catch (error) {
    console.error("Error adding comment:", error);
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('foreign key')) {
        return NextResponse.json({ message: "Invalid research or user reference" }, { status: 400 });
      }
    }

    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
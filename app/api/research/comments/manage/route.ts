// app/api/research/comments/manage/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import client from "../../../utils/db"; // Adjust the path as needed

// Edit a comment
export async function PUT(req: Request) {
  try {
    const { comment_id, content, session_id } = await req.json();

    if (!comment_id) {
      return NextResponse.json({ message: "Comment ID is required" }, { status: 400 });
    }

    if (!content || !content.trim()) {
      return NextResponse.json({ message: "Comment content is required" }, { status: 400 });
    }

    if (!session_id) {
      return NextResponse.json({ message: "Session ID is required" }, { status: 400 });
    }

    // Get user_id from session_id (adjust based on your auth system)
    const user_id = session_id; // Adjust this logic based on your session handling

    // Check if comment exists and belongs to the user
    const commentQuery = `
      SELECT id, user_id, content, is_deleted 
      FROM comments 
      WHERE id = $1 AND is_deleted = false
    `;
    const commentResult = await client.query(commentQuery, [comment_id]);

    if (commentResult.rows.length === 0) {
      return NextResponse.json({ message: "Comment not found" }, { status: 404 });
    }

    const comment = commentResult.rows[0];

    // Check if user owns the comment (or is admin/supervisor)
    if (comment.user_id != user_id) {
      return NextResponse.json({ message: "Unauthorized to edit this comment" }, { status: 403 });
    }

    // Update the comment
    const updateQuery = `
      UPDATE comments 
      SET content = $1, updated_at = NOW(), is_edited = true
      WHERE id = $2
      RETURNING id, content, user_id, research_id, parent_id, identifier, created_at, updated_at, is_edited, is_deleted
    `;

    const result = await client.query(updateQuery, [content.trim(), comment_id]);

    return NextResponse.json({
      message: "Comment updated successfully",
      comment: result.rows[0]
    }, { status: 200 });

  } catch (error) {
    console.error("Error updating comment:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// Delete a comment (soft delete)
export async function DELETE(req: Request) {
  try {
    const { comment_id, session_id } = await req.json();

    if (!comment_id) {
      return NextResponse.json({ message: "Comment ID is required" }, { status: 400 });
    }

    if (!session_id) {
      return NextResponse.json({ message: "Session ID is required" }, { status: 400 });
    }

    // Get user_id from session_id (adjust based on your auth system)
    const user_id = session_id; // Adjust this logic based on your session handling

    // Check if comment exists and belongs to the user
    const commentQuery = `
      SELECT id, user_id, is_deleted 
      FROM comments 
      WHERE id = $1 AND is_deleted = false
    `;
    const commentResult = await client.query(commentQuery, [comment_id]);

    if (commentResult.rows.length === 0) {
      return NextResponse.json({ message: "Comment not found" }, { status: 404 });
    }

    const comment = commentResult.rows[0];

    // Check if user owns the comment (or is admin/supervisor)
    if (comment.user_id != user_id) {
      return NextResponse.json({ message: "Unauthorized to delete this comment" }, { status: 403 });
    }

    // Soft delete the comment
    const deleteQuery = `
      UPDATE comments 
      SET is_deleted = true, updated_at = NOW()
      WHERE id = $1
      RETURNING id
    `;

    const result = await client.query(deleteQuery, [comment_id]);

    return NextResponse.json({
      message: "Comment deleted successfully",
      comment_id: result.rows[0].id
    }, { status: 200 });

  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// Get comment details (for moderation/admin purposes)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const comment_id = searchParams.get('comment_id');
    const session_id = searchParams.get('session_id');

    if (!comment_id) {
      return NextResponse.json({ message: "Comment ID is required" }, { status: 400 });
    }

    if (!session_id) {
      return NextResponse.json({ message: "Session ID is required" }, { status: 400 });
    }

    // Get comment details
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
        r.title as research_title
      FROM comments c
      JOIN researches r ON c.research_id = r.id
      WHERE c.id = $1
    `;

    const result = await client.query(query, [comment_id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ message: "Comment not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0], { status: 200 });

  } catch (error) {
    console.error("Error fetching comment details:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
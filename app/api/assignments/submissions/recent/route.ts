// app/api/assignments/submissions/recent/route.ts

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import client from "../../../utils/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { supervisor_id } = body;

    if (!supervisor_id) {
      return NextResponse.json(
        { success: false, message: "Supervisor ID is required" },
        { status: 400 }
      );
    }

    // Query to get recent UNGRADED submissions for assignments created by this supervisor
    const query = `
      SELECT 
        s.id,
        s.assignment_id,
        s.student_id,
        s.submission_text,
        s.attachments,
        s.submitted_at,
        s.score,
        s.feedback,
        s.graded_at,
        'submitted' as status,
        a.title as assignment_title,
        st.first_name || ' ' || st.last_name as student_name,
        st.email as student_email
      FROM assignment_submissions s
      INNER JOIN assignments a ON s.assignment_id = a.id
      INNER JOIN students st ON s.student_id = st.id
      WHERE a.created_by = $1
        AND s.score IS NULL
        AND s.graded_at IS NULL
      ORDER BY s.submitted_at DESC
      LIMIT 10
    `;

    const result = await client.query(query, [supervisor_id]);

    console.log(`✅ [RECENT SUBMISSIONS API] Found ${result.rows.length} ungraded submissions for supervisor ${supervisor_id}`);

    return NextResponse.json({
      success: true,
      data: {
        submissions: result.rows
      }
    });

  } catch (error) {
    console.error("❌ [RECENT SUBMISSIONS API] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
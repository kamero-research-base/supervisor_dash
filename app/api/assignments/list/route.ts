// app/api/assignments/list/route.ts
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import client from "../../utils/db";
import { parseAttachments } from "../../utils/attachmentParser";

interface AssignmentRequest {
  supervisor_id: number;
}

interface ApiErrorResponse {
  message: string;
  error?: string;
  success?: boolean;
}

// Define the assignment type to fix implicit any error
interface Assignment {
  id: number;
  title: string;
  description: string;
  instructions: string;
  due_date: string;
  is_active: boolean;
  max_score: number;
  attachments: any[];
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
  hashed_id: string;
  submissions_count: number;
  invited_students_count: number;
  average_score: number;
  creator_name: string;
}

// Create standardized error response
const createErrorResponse = (message: string, errorCode?: string, status: number = 400): NextResponse => {
  const response: ApiErrorResponse = {
    message,
    success: false
  };
  
  if (errorCode) {
    response.error = errorCode;
  }
  
  return NextResponse.json(response, { status });
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  let requestBody: AssignmentRequest;
  
  // Parse and validate JSON request body
  try {
    const body = await req.text();
    if (!body.trim()) {
      return createErrorResponse(
        "Request body is empty. Please provide supervisor ID.",
        "EMPTY_REQUEST_BODY"
      );
    }
    
    requestBody = JSON.parse(body);
  } catch (error) {
    console.error('JSON parsing error:', error);
    return createErrorResponse(
      "Invalid JSON format in request body.",
      "INVALID_JSON"
    );
  }

  const { supervisor_id } = requestBody;

  if (!supervisor_id) {
    return createErrorResponse("Supervisor ID is required", "MISSING_SUPERVISOR_ID", 401);
  }

  try {
    // Verify supervisor exists and get their students
    const supervisorQuery = `SELECT students FROM supervisors WHERE id = $1`;
    const supervisorResult = await client.query(supervisorQuery, [supervisor_id]);
    
    if (supervisorResult.rows.length === 0) {
      return createErrorResponse("Supervisor not found", "SUPERVISOR_NOT_FOUND", 404);
    }

    const students = supervisorResult.rows[0].students || [];
    const allUserIds = [parseInt(supervisor_id.toString()), ...students];

    // Enhanced query to get all assignments with proper student count calculation
    const assignmentsQuery = `
      SELECT 
        a.id,
        a.title,
        a.description,
        a.instructions,
        a.due_date,
        a.is_active,
        a.max_score,
        a.attachments,
        -- Convert UTC to local time and ensure consistent formatting
        a.created_at AT TIME ZONE 'UTC' as created_at,
        a.updated_at AT TIME ZONE 'UTC' as updated_at,
        a.created_by,
        a.updated_by,
        a.hashed_id,
        COALESCE(submission_counts.submissions_count, 0) as submissions_count,
        COALESCE(invitation_counts.invited_students_count, 0) as invited_students_count,
        COALESCE(score_averages.average_score, 0) as average_score,
        COALESCE(s.first_name || ' ' || s.last_name, 'Unknown') as creator_name
      FROM assignments a
      LEFT JOIN supervisors s ON s.id = a.created_by
      LEFT JOIN (
        SELECT 
          assignment_id,
          COUNT(*) as submissions_count
        FROM assignment_submissions
        GROUP BY assignment_id
      ) submission_counts ON submission_counts.assignment_id = a.id
      LEFT JOIN (
        SELECT 
          assignment_id,
          COUNT(DISTINCT student_id) as invited_students_count
        FROM assignment_invitations
        GROUP BY assignment_id
      ) invitation_counts ON invitation_counts.assignment_id = a.id
      LEFT JOIN (
        SELECT 
          assignment_id,
          ROUND(AVG(CASE WHEN score IS NOT NULL THEN score END)::numeric, 1) as average_score
        FROM assignment_submissions
        WHERE score IS NOT NULL
        GROUP BY assignment_id
      ) score_averages ON score_averages.assignment_id = a.id
      WHERE a.created_by = ANY($1::int[])
      ORDER BY a.created_at DESC
    `;

    const result = await client.query(assignmentsQuery, [allUserIds]);

    // Process the results to ensure proper data types and handle null values
    const assignments = result.rows.map((assignment: any): Assignment => {
      // Parse attachments safely using the robust parser
      const attachments = parseAttachments(assignment.attachments);

      return {
        ...assignment,
        attachments: attachments,
        submissions_count: parseInt(assignment.submissions_count) || 0,
        invited_students_count: parseInt(assignment.invited_students_count) || 0,
        average_score: assignment.average_score ? parseFloat(assignment.average_score) : 0,
        max_score: parseInt(assignment.max_score),
        is_active: Boolean(assignment.is_active),
        created_by: parseInt(assignment.created_by),
        updated_by: parseInt(assignment.updated_by),
        // Ensure consistent date formatting
        created_at: new Date(assignment.created_at).toISOString(),
        updated_at: new Date(assignment.updated_at).toISOString(),
      };
    });

    // Debug logging to help identify issues
    console.log(`Fetched ${assignments.length} assignments for supervisor ${supervisor_id}`);
    if (assignments.length > 0) {
      console.log(`Sample assignment data:`, {
        id: assignments[0].id,
        title: assignments[0].title,
        invited_students_count: assignments[0].invited_students_count,
        submissions_count: assignments[0].submissions_count,
        created_at: assignments[0].created_at
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        assignments: assignments,
        total_count: assignments.length
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Error retrieving assignments:", error);
    return createErrorResponse(
      "An internal server error occurred while retrieving assignments.",
      "INTERNAL_SERVER_ERROR",
      500
    );
  }
}

// Handle other HTTP methods
export async function GET(): Promise<NextResponse> {
  return createErrorResponse(
    "Method not allowed. This endpoint only accepts POST requests.",
    "METHOD_NOT_ALLOWED",
    405
  );
}

export async function PUT(): Promise<NextResponse> {
  return createErrorResponse(
    "Method not allowed. This endpoint only accepts POST requests.",
    "METHOD_NOT_ALLOWED",
    405
  );
}

export async function DELETE(): Promise<NextResponse> {
  return createErrorResponse(
    "Method not allowed. This endpoint only accepts POST requests.",
    "METHOD_NOT_ALLOWED",
    405
  );
}
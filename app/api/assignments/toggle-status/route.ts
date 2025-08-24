// app/api/assignments/toggle-status/route.ts
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import client from "../../utils/db";
import { sendAssignmentStatusChangeEmail } from "../../utils/assignmentEmails";

interface ToggleStatusRequest {
  id: number;
  supervisor_id: number;
  is_active: boolean;
}

interface ApiErrorResponse {
  message: string;
  error?: string;
  success?: boolean;
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
  let requestBody: ToggleStatusRequest;
  
  // Parse and validate JSON request body
  try {
    const body = await req.text();
    if (!body.trim()) {
      return createErrorResponse(
        "Request body is empty. Please provide assignment ID, supervisor ID, and status.",
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

  const { id, supervisor_id, is_active } = requestBody;

  // Validate required fields
  if (!id || !supervisor_id || typeof is_active !== 'boolean') {
    return createErrorResponse(
      "Assignment ID, supervisor ID, and status (boolean) are required",
      "MISSING_REQUIRED_FIELDS",
      400
    );
  }

  // Convert to numbers safely
  const assignmentId = Number(id);
  const supervisorId = Number(supervisor_id);
  
  if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
    return createErrorResponse("Assignment ID must be a valid positive integer", "INVALID_ASSIGNMENT_ID", 400);
  }
  
  if (!Number.isInteger(supervisorId) || supervisorId <= 0) {
    return createErrorResponse("Supervisor ID must be a valid positive integer", "INVALID_SUPERVISOR_ID", 400);
  }

  try {
    // Begin transaction
    await client.query('BEGIN');

    // Verify supervisor exists and get their students
    const supervisorQuery = `SELECT students FROM supervisors WHERE id = $1`;
    const supervisorResult = await client.query(supervisorQuery, [supervisorId]);
    
    if (supervisorResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return createErrorResponse("Supervisor not found", "SUPERVISOR_NOT_FOUND", 404);
    }

    const students = supervisorResult.rows[0].students || [];
    const allUserIds = [supervisorId, ...students];

    // Verify assignment exists and belongs to supervisor
    const assignmentQuery = `
      SELECT id, title, description, due_date, is_active, created_by
      FROM assignments 
      WHERE id = $1 AND created_by = ANY($2::int[])
    `;
    const assignmentResult = await client.query(assignmentQuery, [assignmentId, allUserIds]);
    
    if (assignmentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return createErrorResponse(
        "Assignment not found or you don't have permission to modify it",
        "ASSIGNMENT_NOT_FOUND",
        404
      );
    }

    const assignment = assignmentResult.rows[0];
    
    // Check if status is already what we want to set
    if (assignment.is_active === is_active) {
      await client.query('ROLLBACK');
      return createErrorResponse(
        `Assignment is already ${is_active ? 'active' : 'inactive'}`,
        "STATUS_UNCHANGED",
        400
      );
    }

    // Update assignment status
    const updateQuery = `
      UPDATE assignments 
      SET 
        is_active = $1,
        updated_at = NOW(),
        updated_by = $2
      WHERE id = $3
      RETURNING id, title, is_active, updated_at
    `;
    
    const updateResult = await client.query(updateQuery, [is_active, supervisorId, assignmentId]);
    
    if (updateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return createErrorResponse("Failed to update assignment status", "UPDATE_FAILED", 500);
    }

    const updatedAssignment = updateResult.rows[0];

    // Get supervisor information for email
    const supervisorInfoQuery = `
      SELECT first_name, last_name, email 
      FROM supervisors 
      WHERE id = $1
    `;
    const supervisorInfo = await client.query(supervisorInfoQuery, [supervisorId]);
    const supervisor = supervisorInfo.rows[0];
    const supervisorName = `${supervisor.first_name} ${supervisor.last_name}`;

    // Get assigned students for email notifications
    const studentsQuery = `
      SELECT 
        ai.student_id,
        s.first_name,
        s.last_name,
        s.email
      FROM assignment_invitations ai
      INNER JOIN students s ON s.id = ai.student_id
      WHERE ai.assignment_id = $1 AND ai.status = 'invited'
    `;
    const studentsResult = await client.query(studentsQuery, [assignmentId]);

    // Commit the transaction
    await client.query('COMMIT');

    // Send status change emails to all assigned students (background process)
    const emailPromises = studentsResult.rows.map(async (student: any) => {
      try {
        await sendAssignmentStatusChangeEmail({
          studentEmail: student.email,
          studentName: `${student.first_name} ${student.last_name}`,
          assignmentTitle: assignment.title,
          supervisorName: supervisorName,
          isActive: is_active,
          dueDate: assignment.due_date,
          assignmentUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/student/assignments/${assignment.id}`,
        });
      } catch (emailError) {
        console.error(`Failed to send status change email to ${student.email}:`, emailError);
        // Don't fail the request if email fails
      }
    });

    // Execute email sending in background (don't wait for completion)
    Promise.allSettled(emailPromises).then((results) => {
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      console.log(`✅ Assignment status change completed:`);
      console.log(`📧 Status change emails: ${successful} sent, ${failed} failed`);
      console.log(`📝 Assignment: "${assignment.title}" | Status: ${is_active ? 'Active' : 'Inactive'}`);
    });

    return NextResponse.json({
      success: true,
      message: `Assignment ${is_active ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: updatedAssignment.id,
        title: updatedAssignment.title,
        is_active: updatedAssignment.is_active,
        updated_at: updatedAssignment.updated_at,
        students_notified: studentsResult.rows.length
      }
    }, { status: 200 });

  } catch (error) {
    // Rollback transaction on error
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error rolling back transaction:', rollbackError);
    }
    
    console.error("Error toggling assignment status:", error);
    return createErrorResponse(
      "An internal server error occurred while updating assignment status.",
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
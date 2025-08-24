// app/api/assignments/delete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import client from "../../utils/db";

interface DeleteAssignmentRequest {
  id: number;
  supervisor_id: number;
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

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  let requestBody: DeleteAssignmentRequest;
      
  // Safe JSON parsing
  try {
    const body = await req.text();
    if (!body.trim()) {
      return createErrorResponse(
        "Request body is empty. Please provide assignment ID and supervisor ID.",
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

  const { id, supervisor_id } = requestBody;
      
  if (!id) {
    return createErrorResponse("Assignment ID is required", "MISSING_ASSIGNMENT_ID");
  }

  if (!supervisor_id) {
    return createErrorResponse("Supervisor ID is required", "MISSING_SUPERVISOR_ID");
  }

  let dbClient;
  
  try {
    // Start database transaction for data consistency
    dbClient = client;
    await dbClient.query('BEGIN');

    // Check if assignment exists and belongs to the supervisor
    const assignmentQuery = `
      SELECT id, title, created_by
      FROM assignments 
      WHERE id = $1
    `;
    
    const assignmentResult = await dbClient.query(assignmentQuery, [id]);

    if (assignmentResult.rows.length === 0) {
      await dbClient.query('ROLLBACK');
      return createErrorResponse(
        "Assignment not found",
        "ASSIGNMENT_NOT_FOUND",
        404
      );
    }

    const assignment = assignmentResult.rows[0];

    // Check if the supervisor has permission to delete this assignment
    if (assignment.created_by !== supervisor_id) {
      await dbClient.query('ROLLBACK');
      return createErrorResponse(
        "Access denied. You can only delete assignments that you created.",
        "ACCESS_DENIED",
        403
      );
    }

    // Check if there are any submissions for this assignment
    const submissionsQuery = `
      SELECT COUNT(*) as submission_count
      FROM assignment_submissions
      WHERE assignment_id = $1
    `;
    
    const submissionsResult = await dbClient.query(submissionsQuery, [id]);
    const submissionCount = parseInt(submissionsResult.rows[0].submission_count);

    // Check if there are any invitations for this assignment
    const invitationsQuery = `
      SELECT COUNT(*) as invitation_count
      FROM assignment_invitations
      WHERE assignment_id = $1
    `;
    
    const invitationsResult = await dbClient.query(invitationsQuery, [id]);
    const invitationCount = parseInt(invitationsResult.rows[0].invitation_count);

    // If there are submissions or invitations, we might want to prevent deletion
    // or cascade delete (depending on business requirements)
    if (submissionCount > 0) {
      await dbClient.query('ROLLBACK');
      return createErrorResponse(
        "Cannot delete assignment because it has student submissions. Consider deactivating the assignment instead.",
        "HAS_SUBMISSIONS",
        409
      );
    }

    // Delete related invitations first (cascade delete)
    if (invitationCount > 0) {
      await dbClient.query(
        `DELETE FROM assignment_invitations WHERE assignment_id = $1`,
        [id]
      );
    }

    // Delete the assignment
    const deleteQuery = `DELETE FROM assignments WHERE id = $1 AND created_by = $2 RETURNING id, title`;
    const deleteResult = await dbClient.query(deleteQuery, [id, supervisor_id]);

    if (deleteResult.rows.length === 0) {
      await dbClient.query('ROLLBACK');
      return createErrorResponse(
        "Failed to delete assignment. It may have been already deleted or you don't have permission.",
        "DELETE_FAILED",
        500
      );
    }

    // Commit the transaction
    await dbClient.query('COMMIT');

    // Log the successful deletion for audit purposes
    console.log(`Assignment deleted successfully: ID ${id}, Title: "${assignment.title}", Supervisor: ${supervisor_id}, Timestamp: ${new Date().toISOString()}`);

    return NextResponse.json({
      message: "Assignment deleted successfully",
      data: {
        deleted_assignment_id: id,
        deleted_assignment_title: assignment.title,
        deleted_invitations: invitationCount
      },
      success: true
    }, { status: 200 });

  } catch (error) {
    // Rollback transaction on any error
    if (dbClient) {
      try {
        await dbClient.query('ROLLBACK');
      } catch (rollbackError) {
        console.error("Error during rollback:", rollbackError);
      }
    }

    console.error("Error during assignment deletion:", error);
    
    // Handle specific database errors
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      if (errorMessage.includes('foreign key constraint') || errorMessage.includes('violates foreign key')) {
        return createErrorResponse(
          "Cannot delete assignment due to related data constraints. Please remove related submissions first.",
          "FOREIGN_KEY_VIOLATION",
          409
        );
      }
      
      if (errorMessage.includes('connection') || errorMessage.includes('timeout')) {
        return createErrorResponse(
          "Database connection error. Please try again.",
          "DATABASE_CONNECTION_ERROR",
          503
        );
      }

      console.error("Specific database error details:", {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        assignmentId: id,
        supervisorId: supervisor_id
      });
    }

    return createErrorResponse(
      "An internal server error occurred while deleting the assignment.",
      "INTERNAL_SERVER_ERROR",
      500
    );
    
  } finally {
    // Always release the database connection
    /* if (dbClient) {
      try {
        dbClient.release();
      } catch (releaseError) {
        console.error("Error releasing database connection:", releaseError);
      }
    } 
      */
  }
}

// Handle other HTTP methods
export async function GET(): Promise<NextResponse> {
  return createErrorResponse(
    "Method not allowed. This endpoint only accepts DELETE requests.",
    "METHOD_NOT_ALLOWED",
    405
  );
}

export async function POST(): Promise<NextResponse> {
  return createErrorResponse(
    "Method not allowed. This endpoint only accepts DELETE requests.",
    "METHOD_NOT_ALLOWED",
    405
  );
}

export async function PUT(): Promise<NextResponse> {
  return createErrorResponse(
    "Method not allowed. This endpoint only accepts DELETE requests.",
    "METHOD_NOT_ALLOWED",
    405
  );
}
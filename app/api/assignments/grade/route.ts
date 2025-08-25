// app/api/assignments/grade/route.ts
import { NextRequest, NextResponse } from "next/server";
import client from "../../utils/db";

// Define types for the grading request
type GradingRequest = {
  submission_id: string;
  supervisor_id: string;
  score: number;
  feedback: string;
  status: 'approved' | 'changes_required' | 'rejected';
};

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

// Validation helper functions
const validateRequired = (value: any, fieldName: string): string | null => {
  if (value === undefined || value === null || value === '') {
    return `${fieldName} is required`;
  }
  return null;
};

const validateScore = (score: number, maxScore: number): string | null => {
  if (isNaN(score)) return "Score must be a valid number";
  if (score < 0) return "Score cannot be negative";
  if (score > maxScore) return `Score cannot exceed maximum score of ${maxScore}`;
  return null;
};

const validateStatus = (status: string): string | null => {
  const validStatuses = ['approved', 'changes_required', 'rejected'];
  if (!validStatuses.includes(status)) {
    return `Status must be one of: ${validStatuses.join(', ')}`;
  }
  return null;
};

// Handle POST request for grading a submission
export async function POST(req: NextRequest): Promise<NextResponse> {
  let dbClient;
  
  try {
    const body = await req.json();
    
    const gradingData: GradingRequest = {
      submission_id: body.submission_id?.toString() || '',
      supervisor_id: body.supervisor_id?.toString() || '',
      score: parseFloat(body.score) || 0,
      feedback: body.feedback?.toString() || '',
      status: body.status?.toString() || 'approved',
    };

    // Comprehensive validation
    const validationErrors: Record<string, string> = {};

    // Required field validations
    const submissionIdError = validateRequired(gradingData.submission_id, 'Submission ID');
    if (submissionIdError) validationErrors.submission_id = submissionIdError;

    const supervisorIdError = validateRequired(gradingData.supervisor_id, 'Supervisor ID');
    if (supervisorIdError) validationErrors.supervisor_id = supervisorIdError;

    const feedbackError = validateRequired(gradingData.feedback, 'Feedback');
    if (feedbackError) validationErrors.feedback = feedbackError;

    const statusError = validateStatus(gradingData.status);
    if (statusError) validationErrors.status = statusError;

    // Return validation errors if any basic validations fail
    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json({
        message: "Please correct the following validation errors:",
        errors: validationErrors,
        success: false
      }, { status: 400 });
    }

    // Start database transaction
    dbClient = client;
    await dbClient.query('BEGIN');

    // First, get submission details and verify access
    const submissionQuery = `
      SELECT 
        asub.id,
        asub.assignment_id,
        asub.student_id,
        asub.status,
        a.max_score,
        a.created_by,
        a.title as assignment_title
      FROM assignment_submissions asub
      INNER JOIN assignments a ON a.id = asub.assignment_id
      WHERE asub.id = $1
    `;
    
    const submissionResult = await dbClient.query(submissionQuery, [
      parseInt(gradingData.submission_id)
    ]);
    
    if (submissionResult.rows.length === 0) {
      await dbClient.query('ROLLBACK');
      return createErrorResponse("Submission not found", "SUBMISSION_NOT_FOUND", 404);
    }

    const submission = submissionResult.rows[0];

    // Verify supervisor has access to this assignment
    if (parseInt(submission.created_by) !== parseInt(gradingData.supervisor_id)) {
      await dbClient.query('ROLLBACK');
      return createErrorResponse("Access denied. You can only grade submissions for assignments you created.", "ACCESS_DENIED", 403);
    }

    // Validate score against max score
    const scoreError = validateScore(gradingData.score, submission.max_score);
    if (scoreError) {
      await dbClient.query('ROLLBACK');
      return createErrorResponse(scoreError, "INVALID_SCORE", 400);
    }

    // Update the submission with grading information
    const updateQuery = `
      UPDATE assignment_submissions 
      SET 
        score = $1,
        feedback = $2,
        status = $3,
        graded_at = NOW()
      WHERE id = $4 
      RETURNING *
    `;

    const result = await dbClient.query(updateQuery, [
      gradingData.score,
      gradingData.feedback.trim(),
      gradingData.status,
      parseInt(gradingData.submission_id)
    ]);
    
    // Commit the transaction
    await dbClient.query('COMMIT');

    // Log the successful grading
    console.log(`Submission graded successfully: Submission ID ${gradingData.submission_id}, Assignment: ${submission.assignment_title}, Score: ${gradingData.score}/${submission.max_score}, Status: ${gradingData.status}`);
  
    return NextResponse.json({
      message: "Submission graded successfully", 
      data: {
        submission: result.rows[0],
        assignment_title: submission.assignment_title
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

    console.error("Error during submission grading:", error);
    
    // Handle specific database errors
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      if (errorMessage.includes('foreign key constraint') || errorMessage.includes('violates foreign key')) {
        return createErrorResponse(
          "Invalid submission or supervisor reference.",
          "FOREIGN_KEY_VIOLATION"
        );
      }
      
      if (errorMessage.includes('connection') || errorMessage.includes('timeout')) {
        return createErrorResponse(
          "Database connection error. Please try again.",
          "DATABASE_CONNECTION_ERROR",
          503
        );
      }
    }

    return createErrorResponse(
      "An internal server error occurred while grading the submission.",
      "INTERNAL_SERVER_ERROR",
      500
    );
  }
}

// Handle other HTTP methods
export async function GET(): Promise<NextResponse> {
  return createErrorResponse(
    "Method not allowed. This endpoint only accepts POST requests for grading submissions.",
    "METHOD_NOT_ALLOWED",
    405
  );
}

export async function PUT(): Promise<NextResponse> {
  return createErrorResponse(
    "Method not allowed. This endpoint only accepts POST requests for grading submissions.",
    "METHOD_NOT_ALLOWED",
    405
  );
}

export async function DELETE(): Promise<NextResponse> {
  return createErrorResponse(
    "Method not allowed. This endpoint only accepts POST requests for grading submissions.",
    "METHOD_NOT_ALLOWED",
    405
  );
}
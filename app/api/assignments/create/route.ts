// app/api/assignments/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import client from "../../utils/db";
import uploadDocumentToSupabase from "../../utils/supabase";

// Define types for the Assignment request
type AssignmentRequest = {
  title: string;
  description: string;
  instructions: string;
  due_date: string;
  is_active: boolean;
  max_score: string;
  created_by: string;
  updated_by: string;
  attachments?: File[];
};

interface ApiErrorResponse {
  message: string;
  error?: string;
  success?: boolean;
}

// Helper function to hash the Assignment ID
async function hashId(id: number): Promise<string> {
  const textEncoder = new TextEncoder();
  const encoded = textEncoder.encode(id.toString());
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
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
    return `${fieldName} is required and cannot be empty`;
  }
  return null;
};

const validateStringLength = (value: string, fieldName: string, min: number, max: number): string | null => {
  if (!value) return null;
  
  const trimmed = value.trim();
  if (trimmed.length < min) {
    return `${fieldName} must be at least ${min} characters long`;
  }
  if (trimmed.length > max) {
    return `${fieldName} cannot exceed ${max} characters`;
  }
  return null;
};

const validateScore = (score: string): string | null => {
  if (!score) return "Max score is required";
  
  const scoreNum = parseInt(score);
  if (isNaN(scoreNum) || scoreNum <= 0) {
    return "Max score must be a positive number";
  }
  
  if (scoreNum > 1000) {
    return "Max score cannot exceed 1000 points";
  }
  
  return null;
};

const validateDueDate = (dateStr: string): string | null => {
  if (!dateStr) return "Due date is required";
  
  const dueDate = new Date(dateStr);
  const now = new Date();
  
  if (isNaN(dueDate.getTime())) {
    return "Invalid due date format";
  }
  
  if (dueDate <= now) {
    return "Due date must be in the future";
  }
  
  // Check if due date is not too far in the future (e.g., not more than 2 years)
  const twoYearsFromNow = new Date();
  twoYearsFromNow.setFullYear(now.getFullYear() + 2);
  
  if (dueDate > twoYearsFromNow) {
    return "Due date cannot be more than 2 years in the future";
  }
  
  return null;
};

const validateFiles = (files: File[]): string | null => {
  if (files.length > 3) {
    return "Maximum 3 files allowed";
  }
  
  const allowedTypes = [
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  for (const file of files) {
    if (file.size > 10 * 1024 * 1024) {
      return `File "${file.name}" exceeds 10MB limit`;
    }
    
    if (!allowedTypes.includes(file.type)) {
      return `File "${file.name}" has invalid format. Only PDF, DOC, DOCX files are allowed`;
    }
  }
  
  return null;
};

// Handle POST request for creating a new Assignment
export async function POST(req: NextRequest): Promise<NextResponse> {
  let dbClient;
  
  try {
    const formData = await req.formData();
    
    // Extract data from FormData
    const assignmentData: AssignmentRequest = {
      title: formData.get('title')?.toString() || '',
      description: formData.get('description')?.toString() || '',
      instructions: formData.get('instructions')?.toString() || '',
      due_date: formData.get('due_date')?.toString() || '',
      is_active: formData.get('is_active')?.toString() === 'true',
      max_score: formData.get('max_score')?.toString() || '',
      created_by: formData.get('created_by')?.toString() || '',
      updated_by: formData.get('updated_by')?.toString() || '',
    };

    // Extract attachments
    const attachments: File[] = [];
    formData.getAll('attachments').forEach(file => {
      if (file instanceof File) {
        attachments.push(file);
      }
    });

    // Comprehensive validation
    const validationErrors: Record<string, string> = {};

    // Required field validations
    const titleError = validateRequired(assignmentData.title, 'Assignment title');
    if (titleError) validationErrors.title = titleError;

    const descriptionError = validateRequired(assignmentData.description, 'Description');
    if (descriptionError) validationErrors.description = descriptionError;

    const instructionsError = validateRequired(assignmentData.instructions, 'Instructions');
    if (instructionsError) validationErrors.instructions = instructionsError;

    const dueDateError = validateDueDate(assignmentData.due_date);
    if (dueDateError) validationErrors.due_date = dueDateError;

    const scoreError = validateScore(assignmentData.max_score);
    if (scoreError) validationErrors.max_score = scoreError;

    const createdByError = validateRequired(assignmentData.created_by, 'Creator ID');
    if (createdByError) validationErrors.created_by = createdByError;

    // Only proceed with detailed validation if required fields are present
    if (Object.keys(validationErrors).length === 0) {
      // String length validations
      const titleLengthError = validateStringLength(assignmentData.title, 'Assignment title', 5, 200);
      if (titleLengthError) validationErrors.title = titleLengthError;

      const descriptionLengthError = validateStringLength(assignmentData.description, 'Description', 10, 2000);
      if (descriptionLengthError) validationErrors.description = descriptionLengthError;

      const instructionsLengthError = validateStringLength(assignmentData.instructions, 'Instructions', 10, 5000);
      if (instructionsLengthError) validationErrors.instructions = instructionsLengthError;

      // File validation
      if (attachments.length > 0) {
        const fileError = validateFiles(attachments);
        if (fileError) validationErrors.attachments = fileError;
      }
    }

    // Return validation errors if any
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

    // Verify supervisor exists
    const supervisorQuery = `SELECT id, first_name, last_name FROM supervisors WHERE id = $1`;
    const supervisorResult = await dbClient.query(supervisorQuery, [parseInt(assignmentData.created_by)]);
    
    if (supervisorResult.rows.length === 0) {
      await dbClient.query('ROLLBACK');
      return createErrorResponse("Supervisor not found", "SUPERVISOR_NOT_FOUND", 404);
    }

    // Check for duplicate title within the supervisor's assignments
    const duplicateTitleQuery = `
      SELECT id, title 
      FROM assignments 
      WHERE LOWER(TRIM(title)) = LOWER(TRIM($1)) 
        AND created_by = $2
    `;
    
    const duplicateTitle = await dbClient.query(duplicateTitleQuery, [
      assignmentData.title,
      parseInt(assignmentData.created_by)
    ]);

    if (duplicateTitle.rows.length > 0) {
      await dbClient.query('ROLLBACK');
      return NextResponse.json({
        message: "An assignment with this title already exists in your collection. Please use a different title.",
        error: "DUPLICATE_TITLE",
        success: false
      }, { status: 409 });
    }

    // Upload attachments to Supabase if any
    const attachmentUrls: string[] = [];
    if (attachments.length > 0) {
      for (const file of attachments) {
        try {
          const fileUrl = await uploadDocumentToSupabase(file, `${assignmentData.title}-${file.name}`);
          attachmentUrls.push(fileUrl);
        } catch (uploadError) {
          await dbClient.query('ROLLBACK');
          console.error("File upload error:", uploadError);
          return createErrorResponse(
            `Failed to upload file: ${file.name}. Please try again.`,
            "FILE_UPLOAD_ERROR",
            500
          );
        }
      }
    }

    // Insert assignment into database
    const insertQuery = `
      INSERT INTO assignments (
        title, description, instructions, due_date, 
        is_active, max_score, attachments, created_by, 
        updated_by, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) 
      RETURNING *
    `;

    const result = await dbClient.query(insertQuery, [
      assignmentData.title.trim(), 
      assignmentData.description.trim(), 
      assignmentData.instructions.trim(), 
      assignmentData.due_date, 
      assignmentData.is_active, 
      parseInt(assignmentData.max_score), 
      JSON.stringify(attachmentUrls),
      parseInt(assignmentData.created_by),
      parseInt(assignmentData.updated_by || assignmentData.created_by)
    ]);
    
    const assignmentId = result.rows[0].id;

    // Generate hashed ID
    const hashedAssignmentId = await hashId(assignmentId);

    // Update assignment with hashed ID
    await dbClient.query(
      `UPDATE assignments SET hashed_id = $1 WHERE id = $2`,
      [hashedAssignmentId, assignmentId]
    );

    // Get the final assignment data
    const updatedResult = await dbClient.query(
      `SELECT * FROM assignments WHERE id = $1`,
      [assignmentId]
    );

    // Commit the transaction
    await dbClient.query('COMMIT');

    // Log the successful creation
    console.log(`Assignment created successfully: ID ${assignmentId}, Title: "${assignmentData.title}", Creator: ${assignmentData.created_by}, Timestamp: ${new Date().toISOString()}`);
  
    return NextResponse.json({
      message: "Assignment created successfully", 
      data: {
        assignment: updatedResult.rows[0],
        attachments_uploaded: attachmentUrls.length
      },
      success: true
    }, { status: 201 });

  } catch (error) {
    // Rollback transaction on any error
    if (dbClient) {
      try {
        await dbClient.query('ROLLBACK');
      } catch (rollbackError) {
        console.error("Error during rollback:", rollbackError);
      }
    }

    console.error("Error during assignment creation:", error);
    
    // Handle specific database errors
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      if (errorMessage.includes('foreign key constraint') || errorMessage.includes('violates foreign key')) {
        return createErrorResponse(
          "Invalid supervisor reference. Please ensure you are properly authenticated.",
          "FOREIGN_KEY_VIOLATION"
        );
      }
      
      if (errorMessage.includes('unique constraint') || errorMessage.includes('duplicate key')) {
        return createErrorResponse(
          "An assignment with similar details already exists.",
          "DUPLICATE_ENTRY",
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
    }

    return createErrorResponse(
      "An internal server error occurred while creating the assignment.",
      "INTERNAL_SERVER_ERROR",
      500
    );
    
  } finally {
    // Always release the database connection
    if (dbClient) {
      try {
        //dbClient.release();
      } catch (releaseError) {
        console.error("Error releasing database connection:", releaseError);
      }
    }
  }
}

// Handle other HTTP methods
export async function GET(): Promise<NextResponse> {
  return createErrorResponse(
    "Method not allowed. This endpoint only accepts POST requests for creating assignments.",
    "METHOD_NOT_ALLOWED",
    405
  );
}

export async function PUT(): Promise<NextResponse> {
  return createErrorResponse(
    "Method not allowed. This endpoint only accepts POST requests for creating assignments.",
    "METHOD_NOT_ALLOWED",
    405
  );
}

export async function DELETE(): Promise<NextResponse> {
  return createErrorResponse(
    "Method not allowed. This endpoint only accepts POST requests for creating assignments.",
    "METHOD_NOT_ALLOWED",
    405
  );
}
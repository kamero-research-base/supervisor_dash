// app/api/assignments/update/route.ts
import { NextRequest, NextResponse } from "next/server";
import client from "../../utils/db";
import uploadDocumentToSupabase from "../../utils/supabase";

// Define types for the Assignment update request (now supporting FormData)
interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string>;
  error?: string;
  success?: boolean;
}

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
  
  // Check if due date is not too far in the future
  const twoYearsFromNow = new Date();
  twoYearsFromNow.setFullYear(now.getFullYear() + 2);
  
  if (dueDate > twoYearsFromNow) {
    return "Due date cannot be more than 2 years in the future";
  }
  
  return null;
};

const validateNumericId = (value: any, fieldName: string): string | null => {
  if (!value) return null;
  
  const numValue = Number(value);
  if (isNaN(numValue) || numValue <= 0 || !Number.isInteger(numValue)) {
    return `${fieldName} must be a valid positive integer`;
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

// Create standardized error response
const createErrorResponse = (message: string, errors?: Record<string, string>, errorCode?: string, status: number = 400): NextResponse => {
  const response: ApiErrorResponse = {
    message,
    success: false
  };
  
  if (errors) {
    response.errors = errors;
  }
  
  if (errorCode) {
    response.error = errorCode;
  }
  
  return NextResponse.json(response, { status });
};

// Handle PUT request for updating assignment (now supports FormData)
export async function PUT(req: NextRequest): Promise<NextResponse> {
  let dbClient;
  let assignmentData: any = null; // Declare at function level for error handling
  
  try {
    // Parse FormData
    const formData = await req.formData();
    
    // Extract data from FormData
    assignmentData = {
      id: parseInt(formData.get('id')?.toString() || '0'),
      title: formData.get('title')?.toString() || '',
      description: formData.get('description')?.toString() || '',
      instructions: formData.get('instructions')?.toString() || '',
      due_date: formData.get('due_date')?.toString() || '',
      is_active: formData.get('is_active')?.toString() === 'true',
      max_score: formData.get('max_score')?.toString() || '',
      supervisor_id: parseInt(formData.get('supervisor_id')?.toString() || '0'),
      keep_existing_files: formData.get('keep_existing_files')?.toString() === 'true', // Flag to keep existing files
    };

    // Extract new attachments
    const newAttachments: File[] = [];
    formData.getAll('attachments').forEach(file => {
      if (file instanceof File && file.size > 0) {
        newAttachments.push(file);
      }
    });

    // Comprehensive validation
    const validationErrors: Record<string, string> = {};

    // Required field validations
    const requiredValidations = [
      { field: assignmentData.id, name: 'id', validator: (val: any) => validateRequired(val, 'Assignment ID') || validateNumericId(val, 'Assignment ID') },
      { field: assignmentData.title, name: 'title', validator: (val: any) => validateRequired(val, 'Assignment title') },
      { field: assignmentData.description, name: 'description', validator: (val: any) => validateRequired(val, 'Description') },
      { field: assignmentData.instructions, name: 'instructions', validator: (val: any) => validateRequired(val, 'Instructions') },
      { field: assignmentData.due_date, name: 'due_date', validator: (val: any) => validateRequired(val, 'Due date') },
      { field: assignmentData.max_score, name: 'max_score', validator: (val: any) => validateRequired(val, 'Max score') },
      { field: assignmentData.supervisor_id, name: 'supervisor_id', validator: (val: any) => validateRequired(val, 'Supervisor ID') || validateNumericId(val, 'Supervisor ID') }
    ];

    // Run required field validations
    for (const { field, name, validator } of requiredValidations) {
      const error = validator(field);
      if (error) {
        validationErrors[name] = error;
      }
    }

    // Only proceed with detailed validation if required fields are present
    if (Object.keys(validationErrors).length === 0) {
      // String length validations
      const titleError = validateStringLength(assignmentData.title?.trim(), 'Assignment title', 5, 200);
      if (titleError) validationErrors.title = titleError;

      const descriptionError = validateStringLength(assignmentData.description?.trim(), 'Description', 10, 2000);
      if (descriptionError) validationErrors.description = descriptionError;

      const instructionsError = validateStringLength(assignmentData.instructions?.trim(), 'Instructions', 10, 5000);
      if (instructionsError) validationErrors.instructions = instructionsError;

      // Due date validation
      const dueDateError = validateDueDate(assignmentData.due_date);
      if (dueDateError) validationErrors.due_date = dueDateError;

      // Score validation
      const scoreError = validateScore(assignmentData.max_score);
      if (scoreError) validationErrors.max_score = scoreError;

      // File validation
      if (newAttachments.length > 0) {
        const fileError = validateFiles(newAttachments);
        if (fileError) validationErrors.attachments = fileError;
      }
    }

    // Return validation errors if any
    if (Object.keys(validationErrors).length > 0) {
      return createErrorResponse(
        "Please correct the following validation errors and try again:",
        validationErrors,
        "VALIDATION_ERROR"
      );
    }

    // Database operations with transaction
    dbClient = client;
    await dbClient.query('BEGIN');

    // Check if assignment exists and belongs to the supervisor
    const existingAssignmentQuery = `
      SELECT id, created_by, title, is_active, attachments
      FROM assignments 
      WHERE id = $1
    `;
    
    const existingAssignment = await dbClient.query(existingAssignmentQuery, [assignmentData.id]);

    if (existingAssignment.rows.length === 0) {
      await dbClient.query('ROLLBACK');
      return createErrorResponse(
        "Assignment not found. The assignment may have been deleted or the ID is incorrect.",
        undefined,
        "ASSIGNMENT_NOT_FOUND",
        404
      );
    }

    const assignment = existingAssignment.rows[0];
    
    // Check if the supervisor has permission to update this assignment
    if (assignment.created_by !== assignmentData.supervisor_id) {
      await dbClient.query('ROLLBACK');
      return createErrorResponse(
        "Access denied. You can only edit assignments that you created.",
        undefined,
        "ACCESS_DENIED",
        403
      );
    }

    // Check for duplicate title within the supervisor's assignments (excluding current assignment)
    const duplicateTitleQuery = `
      SELECT id, title 
      FROM assignments 
      WHERE LOWER(TRIM(title)) = LOWER(TRIM($1)) 
        AND created_by = $2 
        AND id != $3
    `;
    
    const duplicateTitle = await dbClient.query(duplicateTitleQuery, [
      assignmentData.title,
      assignmentData.supervisor_id,
      assignmentData.id
    ]);

    if (duplicateTitle.rows.length > 0) {
      await dbClient.query('ROLLBACK');
      return createErrorResponse(
        "An assignment with this title already exists in your collection. Please use a different title to avoid duplicates.",
        { title: "Title already exists" },
        "DUPLICATE_TITLE",
        409
      );
    }

    // Handle attachments
    let finalAttachments: string[] = [];
    
    if (assignmentData.keep_existing_files && assignment.attachments) {
      // Keep existing attachments if flag is set
      try {
        const existingAttachments = JSON.parse(assignment.attachments);
        finalAttachments = Array.isArray(existingAttachments) ? existingAttachments : [];
      } catch (parseError) {
        console.error('Error parsing existing attachments:', parseError);
        finalAttachments = [];
      }
    }

    // Upload new attachments if any
    if (newAttachments.length > 0) {
      // Check if total files would exceed limit
      if (finalAttachments.length + newAttachments.length > 3) {
        await dbClient.query('ROLLBACK');
        return createErrorResponse(
          `Cannot add ${newAttachments.length} new file(s). This would exceed the maximum of 3 files total (currently have ${finalAttachments.length}).`,
          { attachments: "Too many files" },
          "FILE_LIMIT_EXCEEDED",
          400
        );
      }

      for (const file of newAttachments) {
        try {
          const fileUrl = await uploadDocumentToSupabase(file, `${assignmentData.title}-${file.name}-updated-${Date.now()}`);
          finalAttachments.push(fileUrl);
        } catch (uploadError) {
          await dbClient.query('ROLLBACK');
          console.error("File upload error:", uploadError);
          return createErrorResponse(
            `Failed to upload file: ${file.name}. Please try again.`,
            undefined,
            "FILE_UPLOAD_ERROR",
            500
          );
        }
      }
    }

    // Prepare update query
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    // Always update these core fields with proper sanitization
    updateFields.push(`title = $${paramIndex++}`);
    updateValues.push(assignmentData.title.trim());
    
    updateFields.push(`description = $${paramIndex++}`);
    updateValues.push(assignmentData.description.trim());
    
    updateFields.push(`instructions = $${paramIndex++}`);
    updateValues.push(assignmentData.instructions.trim());
    
    updateFields.push(`due_date = $${paramIndex++}`);
    updateValues.push(assignmentData.due_date);
    
    updateFields.push(`is_active = $${paramIndex++}`);
    updateValues.push(assignmentData.is_active);
    
    updateFields.push(`max_score = $${paramIndex++}`);
    updateValues.push(parseInt(assignmentData.max_score));
    
    updateFields.push(`attachments = $${paramIndex++}`);
    updateValues.push(JSON.stringify(finalAttachments));
    
    updateFields.push(`updated_by = $${paramIndex++}`);
    updateValues.push(assignmentData.supervisor_id);
    
    updateFields.push(`updated_at = $${paramIndex++}`);
    updateValues.push(new Date().toISOString());

    // Add the assignment ID and supervisor ID for WHERE clause
    updateValues.push(assignmentData.id);
    updateValues.push(assignmentData.supervisor_id);

    const updateQuery = `
      UPDATE assignments 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex++} AND created_by = $${paramIndex++}
      RETURNING *
    `;

    const result = await dbClient.query(updateQuery, updateValues);

    if (result.rows.length === 0) {
      await dbClient.query('ROLLBACK');
      return createErrorResponse(
        "Failed to update assignment. The record may have been modified by another user. Please refresh and try again.",
        undefined,
        "UPDATE_FAILED",
        500
      );
    }

    const updatedAssignment = result.rows[0];

    // Commit the transaction
    await dbClient.query('COMMIT');

    // Log the successful update for audit purposes
    console.log(`Assignment updated successfully: ID ${updatedAssignment.id}, Title: "${updatedAssignment.title}", Supervisor: ${assignmentData?.supervisor_id || 'unknown'}, New files: ${newAttachments.length}, Total files: ${finalAttachments.length}, Timestamp: ${new Date().toISOString()}`);

    return NextResponse.json(
      { 
        message: "Assignment has been updated successfully", 
        data: {
          assignment: updatedAssignment,
          new_attachments_uploaded: newAttachments.length,
          total_attachments: finalAttachments.length,
          existing_files_kept: assignmentData.keep_existing_files
        },
        success: true
      }, 
      { status: 200 }
    );

  } catch (error) {
    // Rollback transaction on any error
    if (dbClient) {
      try {
        await dbClient.query('ROLLBACK');
      } catch (rollbackError) {
        console.error("Error during rollback:", rollbackError);
      }
    }

    console.error("Database error during assignment update:", error);
    
    // Handle specific database errors with user-friendly messages
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      // Foreign key constraint violations
      if (errorMessage.includes('foreign key constraint') || errorMessage.includes('violates foreign key')) {
        return createErrorResponse(
          "Invalid reference data detected. Please ensure all data is valid and try again.",
          undefined,
          "FOREIGN_KEY_VIOLATION"
        );
      }
      
      // Unique constraint violations
      if (errorMessage.includes('unique constraint') || errorMessage.includes('duplicate key')) {
        return createErrorResponse(
          "An assignment with similar details already exists. Please modify your data to ensure uniqueness.",
          undefined,
          "DUPLICATE_ENTRY",
          409
        );
      }

      // Database connection issues
      if (errorMessage.includes('connection') || errorMessage.includes('timeout') || errorMessage.includes('network')) {
        return createErrorResponse(
          "Database connection error. Please check your connection and try again in a moment.",
          undefined,
          "DATABASE_CONNECTION_ERROR",
          503
        );
      }

      console.error("Specific database error details:", {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        assignmentId: assignmentData?.id || 'unknown',
        supervisorId: assignmentData?.supervisor_id || 'unknown'
      });
    }

    return createErrorResponse(
      "An internal server error occurred while updating the assignment. Our team has been notified. Please try again later.",
      undefined,
      "INTERNAL_SERVER_ERROR",
      500
    );
  }
}

// Handle other HTTP methods with proper error messages
export async function GET(): Promise<NextResponse> {
  return createErrorResponse(
    "Method not allowed. This endpoint only accepts PUT requests for updating assignment records.",
    undefined,
    "METHOD_NOT_ALLOWED",
    405
  );
}

export async function POST(): Promise<NextResponse> {
  return createErrorResponse(
    "Method not allowed. This endpoint only accepts PUT requests for updating assignment records. Use the create endpoint for new assignments.",
    undefined,
    "METHOD_NOT_ALLOWED",
    405
  );
}

export async function DELETE(): Promise<NextResponse> {
  return createErrorResponse(
    "Method not allowed. This endpoint only accepts PUT requests for updating assignment records. Use the delete endpoint for removing assignments.",
    undefined,
    "METHOD_NOT_ALLOWED",
    405
  );
}
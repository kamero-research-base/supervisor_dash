import { NextRequest, NextResponse } from "next/server";
import client from "../../utils/db";

// Define types for the Research update request
type ResearchUpdateRequest = {
  id: number;
  title: string;
  researcher: string;
  year: string;
  status?: string;
  progress_status: string;
  department?: string;
  student_id?: string;
  abstract?: string;
  keywords?: string;
  supervisor_id: number;
  updated_at: string;
};

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

const validateYear = (year: string): string | null => {
  if (!/^\d{4}$/.test(year)) {
    return "Year must be exactly 4 digits (e.g., 2024)";
  }
  
  const yearNum = parseInt(year);
  const currentYear = new Date().getFullYear();
  
  if (yearNum < 1900) {
    return "Year cannot be before 1900";
  }
  
  if (yearNum > currentYear + 10) {
    return `Year cannot be more than 10 years in the future (maximum: ${currentYear + 10})`;
  }
  
  return null;
};

const validateEnum = (value: string, validValues: string[], fieldName: string): string | null => {
  if (!value) return null;
  
  if (!validValues.includes(value)) {
    return `Invalid ${fieldName}. Valid options are: ${validValues.join(', ')}`;
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

// Handle PUT request for updating research
export async function PUT(req: NextRequest): Promise<NextResponse> {
  let researchData: ResearchUpdateRequest;
  
  // Parse and validate JSON request body
  try {
    const body = await req.text();
    if (!body.trim()) {
      return createErrorResponse(
        "Request body is empty. Please provide research data to update.",
        undefined,
        "EMPTY_REQUEST_BODY"
      );
    }
    
    researchData = JSON.parse(body);
  } catch (error) {
    console.error('JSON parsing error:', error);
    return createErrorResponse(
      "Invalid JSON format in request body. Please ensure your data is properly formatted.",
      undefined,
      "INVALID_JSON"
    );
  }

  // Comprehensive validation
  const validationErrors: Record<string, string> = {};

  // Required field validations
  const requiredValidations = [
    { field: researchData.id, name: 'id', validator: (val: any) => validateRequired(val, 'Research ID') || validateNumericId(val, 'Research ID') },
    { field: researchData.title, name: 'title', validator: (val: any) => validateRequired(val, 'Research title') },
    { field: researchData.researcher, name: 'researcher', validator: (val: any) => validateRequired(val, 'Researcher name') },
    { field: researchData.year, name: 'year', validator: (val: any) => validateRequired(val, 'Year') },
    { field: researchData.progress_status, name: 'progress_status', validator: (val: any) => validateRequired(val, 'Progress status') },
    { field: researchData.supervisor_id, name: 'supervisor_id', validator: (val: any) => validateRequired(val, 'Supervisor ID') || validateNumericId(val, 'Supervisor ID') }
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
    const titleError = validateStringLength(researchData.title?.trim(), 'Research title', 5, 200);
    if (titleError) validationErrors.title = titleError;

    const researcherError = validateStringLength(researchData.researcher?.trim(), 'Researcher name', 2, 100);
    if (researcherError) validationErrors.researcher = researcherError;

    // Year validation
    const yearError = validateYear(researchData.year);
    if (yearError) validationErrors.year = yearError;

    // Enum validations
    const validStatuses = ['Draft', 'Pending', 'Under review', 'On hold', 'Rejected'];
    if (researchData.status) {
      const statusError = validateEnum(researchData.status, validStatuses, 'status');
      if (statusError) validationErrors.status = statusError;
    }

    const validProgressStatuses = ['ongoing', 'completed', 'published'];
    const progressError = validateEnum(researchData.progress_status, validProgressStatuses, 'progress status');
    if (progressError) validationErrors.progress_status = progressError;

    // Optional field validations
    if (researchData.abstract) {
      const abstractError = validateStringLength(researchData.abstract, 'Abstract', 0, 2000);
      if (abstractError) validationErrors.abstract = abstractError;
    }

    if (researchData.keywords) {
      const keywordsError = validateStringLength(researchData.keywords, 'Keywords', 0, 500);
      if (keywordsError) validationErrors.keywords = keywordsError;
    }

    // Optional numeric field validations
    if (researchData.student_id) {
      const studentIdError = validateNumericId(researchData.student_id, 'Student ID');
      if (studentIdError) validationErrors.student_id = studentIdError;
    }

    if (researchData.department) {
      const departmentError = validateNumericId(researchData.department, 'Department ID');
      if (departmentError) validationErrors.department = departmentError;
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
  let dbClient;
  try {
    // Start database transaction for data consistency
    dbClient = await client.connect();
    await dbClient.query('BEGIN');

    // Check if research exists and belongs to the supervisor
    const existingResearchQuery = `
      SELECT id, user_id, title, researcher, student_id, department 
      FROM researches 
      WHERE id = $1
    `;
    
    const existingResearch = await dbClient.query(existingResearchQuery, [researchData.id]);

    if (existingResearch.rows.length === 0) {
      await dbClient.query('ROLLBACK');
      return createErrorResponse(
        "Research record not found. The research may have been deleted or the ID is incorrect.",
        undefined,
        "RESEARCH_NOT_FOUND",
        404
      );
    }

    const research = existingResearch.rows[0];
    
    // Check if the supervisor has permission to update this research
    if (research.user_id !== researchData.supervisor_id) {
      await dbClient.query('ROLLBACK');
      return createErrorResponse(
        "Access denied. You can only edit research that you supervise.",
        undefined,
        "ACCESS_DENIED",
        403
      );
    }

    // If student_id is provided, verify the student exists and belongs to the supervisor
    if (researchData.student_id) {
      const studentCheckQuery = `
        SELECT id, first_name, last_name, status 
        FROM students 
        WHERE id = $1 AND supervisor_id = $2
      `;
      
      const studentCheck = await dbClient.query(studentCheckQuery, [
        researchData.student_id, 
        researchData.supervisor_id
      ]);

      if (studentCheck.rows.length === 0) {
        await dbClient.query('ROLLBACK');
        return createErrorResponse(
          "The selected student is not found or is not under your supervision. Please select a valid student from your assigned students.",
          { student_id: "Invalid student selection" },
          "INVALID_STUDENT"
        );
      }

      const student = studentCheck.rows[0];
      if (student.status !== 'active') {
        await dbClient.query('ROLLBACK');
        return createErrorResponse(
          `Cannot assign research to inactive student (${student.first_name} ${student.last_name}). Please select an active student.`,
          { student_id: "Student is not active" },
          "INACTIVE_STUDENT"
        );
      }
    }

    // If department is provided, verify it exists and is accessible
    if (researchData.department) {
      const departmentCheckQuery = `
        SELECT d.id, d.name, d.school
        FROM departments d
        INNER JOIN supervisors s ON d.school = s.school_id
        WHERE d.id = $1 AND s.id = $2
      `;
      
      const departmentCheck = await dbClient.query(departmentCheckQuery, [
        researchData.department, 
        researchData.supervisor_id
      ]);

      if (departmentCheck.rows.length === 0) {
        await dbClient.query('ROLLBACK');
        return createErrorResponse(
          "The selected department is not found or is not accessible to you. Please select a valid department from your school.",
          { department: "Invalid department selection" },
          "INVALID_DEPARTMENT"
        );
      }
    }

    // Check for duplicate title within the supervisor's research (excluding current research)
    const duplicateTitleQuery = `
      SELECT id, title 
      FROM researches 
      WHERE LOWER(TRIM(title)) = LOWER(TRIM($1)) 
        AND user_id = $2 
        AND id != $3
    `;
    
    const duplicateTitle = await dbClient.query(duplicateTitleQuery, [
      researchData.title,
      researchData.supervisor_id,
      researchData.id
    ]);

    if (duplicateTitle.rows.length > 0) {
      await dbClient.query('ROLLBACK');
      return createErrorResponse(
        "A research with this title already exists in your collection. Please use a different title to avoid duplicates.",
        { title: "Title already exists" },
        "DUPLICATE_TITLE",
        409
      );
    }

    // Prepare update query - only update provided fields
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    // Always update these core fields with proper sanitization
    updateFields.push(`title = $${paramIndex++}`);
    updateValues.push(researchData.title.trim());
    
    updateFields.push(`researcher = $${paramIndex++}`);
    updateValues.push(researchData.researcher.trim());
    
    updateFields.push(`year = $${paramIndex++}`);
    updateValues.push(researchData.year);
    
    updateFields.push(`progress_status = $${paramIndex++}`);
    updateValues.push(researchData.progress_status);
    
    updateFields.push(`updated_at = $${paramIndex++}`);
    updateValues.push(new Date().toISOString());

    // Optional fields - only update if provided and valid
    if (researchData.status && researchData.status.trim()) {
      updateFields.push(`status = $${paramIndex++}`);
      updateValues.push(researchData.status.trim());
    }

    if (researchData.department && researchData.department.trim()) {
      updateFields.push(`department = $${paramIndex++}`);
      updateValues.push(parseInt(researchData.department));
    }

    if (researchData.student_id && researchData.student_id.trim()) {
      updateFields.push(`student_id = $${paramIndex++}`);
      updateValues.push(parseInt(researchData.student_id));
    }

    // Handle optional text fields (can be empty)
    if (researchData.abstract !== undefined) {
      updateFields.push(`abstract = $${paramIndex++}`);
      updateValues.push(researchData.abstract?.trim() || null);
    }

    if (researchData.keywords !== undefined) {
      updateFields.push(`keywords = $${paramIndex++}`);
      updateValues.push(researchData.keywords?.trim() || null);
    }

    // Add the research ID and supervisor ID for WHERE clause
    updateValues.push(researchData.id);
    updateValues.push(researchData.supervisor_id);

    const updateQuery = `
      UPDATE researches 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
      RETURNING *
    `;

    const result = await dbClient.query(updateQuery, updateValues);

    if (result.rows.length === 0) {
      await dbClient.query('ROLLBACK');
      return createErrorResponse(
        "Failed to update research. The record may have been modified by another user. Please refresh and try again.",
        undefined,
        "UPDATE_FAILED",
        500
      );
    }

    const updatedResearch = result.rows[0];

    // Commit the transaction
    await dbClient.query('COMMIT');

    // Log the successful update for audit purposes
    console.log(`Research updated successfully: ID ${updatedResearch.id}, Title: "${updatedResearch.title}", Supervisor: ${researchData.supervisor_id}, Timestamp: ${new Date().toISOString()}`);

    return NextResponse.json(
      { 
        message: "Research has been updated successfully", 
        data: updatedResearch,
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

    console.error("Database error during research update:", error);
    
    // Handle specific database errors with user-friendly messages
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      // Foreign key constraint violations
      if (errorMessage.includes('foreign key constraint') || errorMessage.includes('violates foreign key')) {
        return createErrorResponse(
          "Invalid reference data detected. Please ensure the selected student and department are valid and try again.",
          undefined,
          "FOREIGN_KEY_VIOLATION"
        );
      }
      
      // Unique constraint violations
      if (errorMessage.includes('unique constraint') || errorMessage.includes('duplicate key')) {
        return createErrorResponse(
          "A research with similar details already exists. Please modify your data to ensure uniqueness.",
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

      // Permission/authentication errors
      if (errorMessage.includes('permission') || errorMessage.includes('authentication')) {
        return createErrorResponse(
          "Database permission error. Please contact system administrator.",
          undefined,
          "DATABASE_PERMISSION_ERROR",
          403
        );
      }

      // Log the actual error for debugging (but don't expose sensitive details)
      console.error("Specific database error details:", {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        researchId: researchData?.id,
        supervisorId: researchData?.supervisor_id
      });
    }

    return createErrorResponse(
      "An internal server error occurred while updating the research. Our team has been notified. Please try again later.",
      undefined,
      "INTERNAL_SERVER_ERROR",
      500
    );
    
  } finally {
    // Always release the database connection
    if (dbClient) {
      try {
        dbClient.release();
      } catch (releaseError) {
        console.error("Error releasing database connection:", releaseError);
      }
    }
  }
}

// Handle other HTTP methods with proper error messages
export async function GET(): Promise<NextResponse> {
  return createErrorResponse(
    "Method not allowed. This endpoint only accepts PUT requests for updating research records.",
    undefined,
    "METHOD_NOT_ALLOWED",
    405
  );
}

export async function POST(): Promise<NextResponse> {
  return createErrorResponse(
    "Method not allowed. This endpoint only accepts PUT requests for updating research records. Use the create endpoint for new research.",
    undefined,
    "METHOD_NOT_ALLOWED",
    405
  );
}

export async function DELETE(): Promise<NextResponse> {
  return createErrorResponse(
    "Method not allowed. This endpoint only accepts PUT requests for updating research records. Use the delete endpoint for removing research.",
    undefined,
    "METHOD_NOT_ALLOWED",
    405
  );
}

export async function PATCH(): Promise<NextResponse> {
  return createErrorResponse(
    "Method not allowed. This endpoint only accepts PUT requests for updating research records.",
    undefined,
    "METHOD_NOT_ALLOWED",
    405
  );
}
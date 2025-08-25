// app/api/assignments/invite/route.ts
import { NextRequest, NextResponse } from 'next/server';
import client from "../../utils/db";

interface InviteStudentsRequest {
  assignment_id: number;
  student_ids: number[];
  supervisor_id: number;
  custom_message?: string;
}

interface ApiErrorResponse {
  message: string;
  error?: string;
  success?: boolean;
}

// Add interface for student data
interface StudentRecord {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
}

// Add interface for assignment data
interface AssignmentRecord {
  id: number;
  title: string;
  description: string;
  due_date: string; // Database returns dates as strings
  created_by: number;
  is_active: boolean;
}

// Add interface for supervisor data
interface SupervisorRecord {
  first_name: string;
  last_name: string;
  email: string;
}

// Add interface for email result
interface EmailResult {
  student_id: number;
  student_name: string;
  email_sent: boolean;
}

// Import the NEW Brevo email service
import { sendAssignmentInvitationEmail } from '../../utils/assignmentEmails';

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
  let requestBody: InviteStudentsRequest;
  
  console.log('🔍 [INVITE DEBUG] Starting invitation process...');
      
  // Safe JSON parsing
  try {
    const body = await req.text();
    console.log('🔍 [INVITE DEBUG] Raw request body:', body);
    
    if (!body.trim()) {
      console.log('❌ [INVITE DEBUG] Empty request body');
      return createErrorResponse(
        "Request body is empty. Please provide invitation data.",
        "EMPTY_REQUEST_BODY"
      );
    }
    
    requestBody = JSON.parse(body);
    console.log('🔍 [INVITE DEBUG] Parsed request body:', requestBody);
  } catch (error) {
    console.error('❌ [INVITE DEBUG] JSON parsing error:', error);
    return createErrorResponse(
      "Invalid JSON format in request body.",
      "INVALID_JSON"
    );
  }

  const { assignment_id, student_ids, supervisor_id, custom_message } = requestBody;
  
  console.log('🔍 [INVITE DEBUG] Request parameters:', {
    assignment_id,
    student_ids,
    supervisor_id,
    custom_message,
    student_ids_type: typeof student_ids,
    student_ids_is_array: Array.isArray(student_ids)
  });
      
  // Validation
  if (!assignment_id) {
    console.log('❌ [INVITE DEBUG] Missing assignment ID');
    return createErrorResponse("Assignment ID is required", "MISSING_ASSIGNMENT_ID");
  }

  if (!supervisor_id) {
    console.log('❌ [INVITE DEBUG] Missing supervisor ID');
    return createErrorResponse("Supervisor ID is required", "MISSING_SUPERVISOR_ID");
  }

  if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
    console.log('❌ [INVITE DEBUG] Invalid student IDs:', { student_ids, isArray: Array.isArray(student_ids) });
    return createErrorResponse("At least one student ID is required", "MISSING_STUDENT_IDS");
  }

  if (student_ids.length > 50) {
    console.log('❌ [INVITE DEBUG] Too many students');
    return createErrorResponse("Cannot invite more than 50 students at once", "TOO_MANY_STUDENTS");
  }

  // Fix: Properly declare and type the database client
  let databaseClient: any = null;
  
  try {
    // Start database transaction for data consistency
    databaseClient = client;
    await databaseClient.query('BEGIN');
    console.log('✅ [INVITE DEBUG] Database transaction started');

    // Verify assignment exists and belongs to supervisor
    const assignmentQuery = `
      SELECT id, title, description, due_date, created_by, is_active
      FROM assignments 
      WHERE id = $1
    `;
    
    console.log('🔍 [INVITE DEBUG] Checking assignment:', assignment_id);
    const assignmentResult = await databaseClient.query(assignmentQuery, [assignment_id]);

    if (assignmentResult.rows.length === 0) {
      console.log('❌ [INVITE DEBUG] Assignment not found');
      await databaseClient.query('ROLLBACK');
      return createErrorResponse(
        "Assignment not found",
        "ASSIGNMENT_NOT_FOUND",
        404
      );
    }

    const assignment: AssignmentRecord = assignmentResult.rows[0];
    console.log('✅ [INVITE DEBUG] Assignment found:', {
      id: assignment.id,
      title: assignment.title,
      created_by: assignment.created_by,
      is_active: assignment.is_active
    });

    // Check if the supervisor has permission to invite students to this assignment
    if (assignment.created_by !== supervisor_id) {
      console.log('❌ [INVITE DEBUG] Access denied. Assignment creator:', assignment.created_by, 'vs Supervisor:', supervisor_id);
      await databaseClient.query('ROLLBACK');
      return createErrorResponse(
        "Access denied. You can only invite students to assignments that you created.",
        "ACCESS_DENIED",
        403
      );
    }

    // Check if assignment is active
    if (!assignment.is_active) {
      console.log('❌ [INVITE DEBUG] Assignment is inactive');
      await databaseClient.query('ROLLBACK');
      return createErrorResponse(
        "Cannot invite students to an inactive assignment.",
        "ASSIGNMENT_INACTIVE",
        400
      );
    }

    // Get supervisor information for email
    const supervisorQuery = `
      SELECT first_name, last_name, email
      FROM supervisors
      WHERE id = $1
    `;
    
    console.log('🔍 [INVITE DEBUG] Getting supervisor info for ID:', supervisor_id);
    const supervisorResult = await databaseClient.query(supervisorQuery, [supervisor_id]);
    
    if (supervisorResult.rows.length === 0) {
      console.log('❌ [INVITE DEBUG] Supervisor not found');
      await databaseClient.query('ROLLBACK');
      return createErrorResponse("Supervisor not found", "SUPERVISOR_NOT_FOUND", 404);
    }

    const supervisor: SupervisorRecord = supervisorResult.rows[0];
    const supervisorName = `${supervisor.first_name} ${supervisor.last_name}`;
    console.log('✅ [INVITE DEBUG] Supervisor found:', supervisorName);

    // Verify all students exist and belong to this supervisor
    const studentsQuery = `
      SELECT id, first_name, last_name, email, status
      FROM students
      WHERE id = ANY($1) AND supervisor_id = $2
    `;
    
    console.log('🔍 [INVITE DEBUG] Checking students:', student_ids);
    const studentsResult = await databaseClient.query(studentsQuery, [student_ids, supervisor_id]);
    
    console.log('🔍 [INVITE DEBUG] Students query result:', {
      expected_count: student_ids.length,
      found_count: studentsResult.rows.length,
      found_students: studentsResult.rows.map((s: any) => ({ id: s.id, name: `${s.first_name} ${s.last_name}` }))
    });
    
    if (studentsResult.rows.length !== student_ids.length) {
      await databaseClient.query('ROLLBACK');
      // Fix: Add proper TypeScript types
      const foundIds = studentsResult.rows.map((item: StudentRecord) => item.id);
      const missingIds = student_ids.filter((itemId: number) => !foundIds.includes(itemId));
      console.log('❌ [INVITE DEBUG] Missing students:', missingIds);
      return createErrorResponse(
        `Some students not found or not under your supervision: ${missingIds.join(', ')}`,
        "INVALID_STUDENTS",
        400
      );
    }

    const students: StudentRecord[] = studentsResult.rows;

    // Check for inactive students
    const inactiveStudents = students.filter((item: StudentRecord) => item.status !== 'active');
    if (inactiveStudents.length > 0) {
      const inactiveNames = inactiveStudents.map((item: StudentRecord) => `${item.first_name} ${item.last_name}`);
      console.log('⚠️ [INVITE DEBUG] Proceeding with inactive students:', inactiveNames);
      // Continue with invitation process instead of returning error
    }

    // Check for existing invitations
    const existingInvitationsQuery = `
      SELECT student_id
      FROM assignment_invitations
      WHERE assignment_id = $1 AND student_id = ANY($2)
    `;
    
    console.log('🔍 [INVITE DEBUG] Checking for existing invitations...');
    const existingResult = await databaseClient.query(existingInvitationsQuery, [assignment_id, student_ids]);
    // Fix: Add proper TypeScript types
    const alreadyInvitedIds = existingResult.rows.map((item: { student_id: number }) => item.student_id);
    
    console.log('🔍 [INVITE DEBUG] Already invited students:', alreadyInvitedIds);
    
    if (alreadyInvitedIds.length > 0) {
      // Fix: Add proper TypeScript types
      const alreadyInvitedStudents = students.filter((item: StudentRecord) => alreadyInvitedIds.includes(item.id));
      // Fix: Add proper TypeScript types
      const alreadyInvitedNames = alreadyInvitedStudents.map((item: StudentRecord) => `${item.first_name} ${item.last_name}`);
      
      console.log('❌ [INVITE DEBUG] Students already invited:', alreadyInvitedNames);
      await databaseClient.query('ROLLBACK');
      return createErrorResponse(
        `Some students are already invited to this assignment: ${alreadyInvitedNames.join(', ')}`,
        "ALREADY_INVITED",
        409
      );
    }

    // Insert invitations
    console.log('🔍 [INVITE DEBUG] Creating invitations...');
    // Fix: Add proper TypeScript types
    const invitationPromises = students.map((item: StudentRecord) => {
      return databaseClient.query(
        `INSERT INTO assignment_invitations 
         (assignment_id, student_id, status, invited_at, custom_message) 
         VALUES ($1, $2, 'pending', NOW(), $3)
         RETURNING id`,
        [assignment_id, item.id, custom_message || null]
      );
    });

    const invitationResults = await Promise.all(invitationPromises);
    console.log('✅ [INVITE DEBUG] Invitations created:', invitationResults.length);

    // Send emails to all students using the NEW Brevo service
    console.log('🔍 [INVITE DEBUG] Sending emails using Brevo...');
    // Fix: Add proper TypeScript types
    const emailPromises = students.map(async (item: StudentRecord): Promise<EmailResult> => {
      const emailSent = await sendAssignmentInvitationEmail({
        studentEmail: item.email,
        studentName: `${item.first_name} ${item.last_name}`,
        assignmentTitle: assignment.title,
        assignmentDescription: assignment.description,
        supervisorName: supervisorName,
        dueDate: assignment.due_date,
        customMessage: custom_message
      });
      
      return {
        student_id: item.id,
        student_name: `${item.first_name} ${item.last_name}`,
        email_sent: emailSent
      };
    });

    const emailResults = await Promise.all(emailPromises);

    // Commit the transaction
    await databaseClient.query('COMMIT');
    console.log('✅ [INVITE DEBUG] Transaction committed');

    // Count successful emails
    const successfulEmails = emailResults.filter(result => result.email_sent).length;
    const failedEmails = emailResults.filter(result => !result.email_sent);

    console.log('✅ [INVITE DEBUG] Email results:', {
      total: emailResults.length,
      successful: successfulEmails,
      failed: failedEmails.length
    });

    // Log the successful invitations
    console.log(`✅ Assignment invitations sent: Assignment ID ${assignment_id}, Students invited: ${students.length}, Emails sent: ${successfulEmails}, Supervisor: ${supervisor_id}, Timestamp: ${new Date().toISOString()}`);

    return NextResponse.json({
      message: `Successfully invited ${students.length} students to the assignment`,
      data: {
        assignment_id: assignment_id,
        assignment_title: assignment.title,
        invitations_sent: students.length,
        emails_sent: successfulEmails,
        emails_failed: failedEmails.length,
        failed_emails: failedEmails.length > 0 ? failedEmails.map((item: EmailResult) => item.student_name) : [],
        // Fix: Add proper TypeScript types
        invited_students: students.map((item: StudentRecord) => ({
          id: item.id,
          name: `${item.first_name} ${item.last_name}`,
          email: item.email
        }))
      },
      success: true
    }, { status: 201 });

  } catch (error) {
    // Rollback transaction on any error
    if (databaseClient) {
      try {
        await databaseClient.query('ROLLBACK');
      } catch (rollbackError) {
        console.error("Error during rollback:", rollbackError);
      }
    }

    console.error("❌ [INVITE DEBUG] Error during student invitation:", error);
    
    // Handle specific database errors
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      if (errorMessage.includes('foreign key constraint') || errorMessage.includes('violates foreign key')) {
        return createErrorResponse(
          "Invalid assignment or student reference. Please verify the data and try again.",
          "FOREIGN_KEY_VIOLATION"
        );
      }
      
      if (errorMessage.includes('unique constraint') || errorMessage.includes('duplicate key')) {
        return createErrorResponse(
          "Some students are already invited to this assignment.",
          "DUPLICATE_INVITATION",
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

      console.error("❌ [INVITE DEBUG] Specific database error details:", {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        assignmentId: assignment_id,
        supervisorId: supervisor_id,
        studentIds: student_ids
      });
    }

    return createErrorResponse(
      "An internal server error occurred while sending invitations.",
      "INTERNAL_SERVER_ERROR",
      500
    );
    
  } finally {
    // Always release the database connection
    /* if (databaseClient) {
      try {
        databaseClient.release();
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
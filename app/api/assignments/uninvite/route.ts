// app/api/assignments/uninvite/route.ts
import { NextRequest, NextResponse } from 'next/server';
import client from "../../utils/db";

interface UninviteStudentsRequest {
  assignment_id: number;
  student_ids: number[];
  supervisor_id: number;
  reason?: string; // Optional reason for removal
}

interface ApiErrorResponse {
  message: string;
  error?: string;
  success?: boolean;
}

// Add interface for student invitation data
interface StudentInvitationRecord {
  id: number;
  student_id: number;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
}

// Add interface for assignment data
interface AssignmentRecord {
  id: number;
  title: string;
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

// Import the Brevo email service for removal notifications
import { sendAssignmentRemovalEmail } from '../../utils/assignmentEmails';

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
  let requestBody: UninviteStudentsRequest;
  
  console.log('🔍 [UNINVITE DEBUG] Starting uninvite process...');
      
  // Safe JSON parsing
  try {
    const body = await req.text();
    console.log('🔍 [UNINVITE DEBUG] Raw request body:', body);
    
    if (!body.trim()) {
      console.log('❌ [UNINVITE DEBUG] Empty request body');
      return createErrorResponse(
        "Request body is empty. Please provide uninvitation data.",
        "EMPTY_REQUEST_BODY"
      );
    }
    
    requestBody = JSON.parse(body);
    console.log('🔍 [UNINVITE DEBUG] Parsed request body:', requestBody);
  } catch (error) {
    console.error('❌ [UNINVITE DEBUG] JSON parsing error:', error);
    return createErrorResponse(
      "Invalid JSON format in request body.",
      "INVALID_JSON"
    );
  }

  const { assignment_id, student_ids, supervisor_id, reason } = requestBody;
  
  console.log('🔍 [UNINVITE DEBUG] Request parameters:', {
    assignment_id,
    student_ids,
    supervisor_id,
    reason,
    student_ids_type: typeof student_ids,
    student_ids_is_array: Array.isArray(student_ids)
  });
      
  // Validation
  if (!assignment_id) {
    console.log('❌ [UNINVITE DEBUG] Missing assignment ID');
    return createErrorResponse("Assignment ID is required", "MISSING_ASSIGNMENT_ID");
  }

  if (!supervisor_id) {
    console.log('❌ [UNINVITE DEBUG] Missing supervisor ID');
    return createErrorResponse("Supervisor ID is required", "MISSING_SUPERVISOR_ID");
  }

  if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
    console.log('❌ [UNINVITE DEBUG] Invalid student IDs:', { student_ids, isArray: Array.isArray(student_ids) });
    return createErrorResponse("At least one student ID is required", "MISSING_STUDENT_IDS");
  }

  let databaseClient: any = null;
  
  try {
    // Start database transaction for data consistency
    databaseClient = client;
    await databaseClient.query('BEGIN');
    console.log('✅ [UNINVITE DEBUG] Database transaction started');

    // Verify assignment exists and belongs to supervisor
    const assignmentQuery = `
      SELECT id, title, created_by, is_active
      FROM assignments 
      WHERE id = $1
    `;
    
    console.log('🔍 [UNINVITE DEBUG] Checking assignment:', assignment_id);
    const assignmentResult = await databaseClient.query(assignmentQuery, [assignment_id]);

    if (assignmentResult.rows.length === 0) {
      console.log('❌ [UNINVITE DEBUG] Assignment not found');
      await databaseClient.query('ROLLBACK');
      return createErrorResponse(
        "Assignment not found",
        "ASSIGNMENT_NOT_FOUND",
        404
      );
    }

    const assignment: AssignmentRecord = assignmentResult.rows[0];
    console.log('✅ [UNINVITE DEBUG] Assignment found:', {
      id: assignment.id,
      title: assignment.title,
      created_by: assignment.created_by,
      is_active: assignment.is_active
    });

    // Check if the supervisor has permission to uninvite students from this assignment
    if (assignment.created_by !== supervisor_id) {
      console.log('❌ [UNINVITE DEBUG] Access denied. Assignment creator:', assignment.created_by, 'vs Supervisor:', supervisor_id);
      await databaseClient.query('ROLLBACK');
      return createErrorResponse(
        "Access denied. You can only remove students from assignments that you created.",
        "ACCESS_DENIED",
        403
      );
    }

    // Get supervisor information for email
    const supervisorQuery = `
      SELECT first_name, last_name, email
      FROM supervisors
      WHERE id = $1
    `;
    
    console.log('🔍 [UNINVITE DEBUG] Getting supervisor info for ID:', supervisor_id);
    const supervisorResult = await databaseClient.query(supervisorQuery, [supervisor_id]);
    
    if (supervisorResult.rows.length === 0) {
      console.log('❌ [UNINVITE DEBUG] Supervisor not found');
      await databaseClient.query('ROLLBACK');
      return createErrorResponse("Supervisor not found", "SUPERVISOR_NOT_FOUND", 404);
    }

    const supervisor: SupervisorRecord = supervisorResult.rows[0];
    const supervisorName = `${supervisor.first_name} ${supervisor.last_name}`;
    console.log('✅ [UNINVITE DEBUG] Supervisor found:', supervisorName);

    // Get existing invitations for the students with student details
    const existingInvitationsQuery = `
      SELECT ai.id, ai.student_id, ai.status, s.first_name, s.last_name, s.email
      FROM assignment_invitations ai
      LEFT JOIN students s ON s.id = ai.student_id
      WHERE ai.assignment_id = $1 AND ai.student_id = ANY($2)
    `;
    
    console.log('🔍 [UNINVITE DEBUG] Checking existing invitations...');
    const existingResult = await databaseClient.query(existingInvitationsQuery, [assignment_id, student_ids]);
    
    if (existingResult.rows.length === 0) {
      console.log('❌ [UNINVITE DEBUG] No invitations found for the specified students');
      await databaseClient.query('ROLLBACK');
      return createErrorResponse(
        "No invitations found for the specified students in this assignment.",
        "NO_INVITATIONS_FOUND",
        404
      );
    }

    const existingInvitations: StudentInvitationRecord[] = existingResult.rows;
    console.log('🔍 [UNINVITE DEBUG] Found invitations:', existingInvitations.map((inv: StudentInvitationRecord) => ({
      id: inv.id,
      student_id: inv.student_id,
      student_name: `${inv.first_name} ${inv.last_name}`,
      status: inv.status
    })));

    // Check if any students have already submitted assignments
    const submissionsQuery = `
      SELECT DISTINCT student_id, COUNT(*) as submission_count
      FROM assignment_submissions
      WHERE assignment_id = $1 AND student_id = ANY($2)
      GROUP BY student_id
    `;
    
    const submissionsResult = await databaseClient.query(submissionsQuery, [assignment_id, student_ids]);
    
    if (submissionsResult.rows.length > 0) {
      const studentsWithSubmissions = submissionsResult.rows.map((row: { student_id: number }) => row.student_id);
      const studentsWithSubmissionsNames = existingInvitations
        .filter((inv: StudentInvitationRecord) => studentsWithSubmissions.includes(inv.student_id))
        .map((inv: StudentInvitationRecord) => `${inv.first_name} ${inv.last_name}`);
      
      console.log('⚠️ [UNINVITE DEBUG] Some students have submissions:', studentsWithSubmissionsNames);
      await databaseClient.query('ROLLBACK');
      return createErrorResponse(
        `Cannot remove students who have already submitted assignments: ${studentsWithSubmissionsNames.join(', ')}. Consider deactivating the assignment instead.`,
        "STUDENTS_HAVE_SUBMISSIONS",
        409
      );
    }

    // Send removal notification emails BEFORE removing invitations
    console.log('🔍 [UNINVITE DEBUG] Sending removal notification emails...');
    const emailPromises = existingInvitations.map(async (invitation: StudentInvitationRecord): Promise<EmailResult> => {
      const emailSent = await sendAssignmentRemovalEmail({
        studentEmail: invitation.email,
        studentName: `${invitation.first_name} ${invitation.last_name}`,
        assignmentTitle: assignment.title,
        supervisorName: supervisorName,
        reason: reason
      });
      
      return {
        student_id: invitation.student_id,
        student_name: `${invitation.first_name} ${invitation.last_name}`,
        email_sent: emailSent
      };
    });

    const emailResults = await Promise.all(emailPromises);

    // Count successful emails
    const successfulEmails = emailResults.filter(result => result.email_sent).length;
    const failedEmails = emailResults.filter(result => !result.email_sent);

    console.log('✅ [UNINVITE DEBUG] Email results:', {
      total: emailResults.length,
      successful: successfulEmails,
      failed: failedEmails.length
    });

    // Remove invitations
    console.log('🔍 [UNINVITE DEBUG] Removing invitations...');
    const deleteQuery = `
      DELETE FROM assignment_invitations 
      WHERE assignment_id = $1 AND student_id = ANY($2)
      RETURNING id, student_id
    `;

    const deleteResult = await databaseClient.query(deleteQuery, [assignment_id, student_ids]);
    console.log('✅ [UNINVITE DEBUG] Invitations removed:', deleteResult.rows.length);

    // Commit the transaction
    await databaseClient.query('COMMIT');
    console.log('✅ [UNINVITE DEBUG] Transaction committed');

    // Prepare response data
    const removedStudents = existingInvitations.map((inv: StudentInvitationRecord) => ({
      id: inv.student_id,
      name: `${inv.first_name} ${inv.last_name}`,
      email: inv.email,
      status: inv.status
    }));

    console.log(`✅ Assignment uninvitations completed: Assignment ID ${assignment_id}, Students removed: ${removedStudents.length}, Emails sent: ${successfulEmails}, Supervisor: ${supervisor_id}, Timestamp: ${new Date().toISOString()}`);

    return NextResponse.json({
      message: `Successfully removed ${removedStudents.length} student${removedStudents.length !== 1 ? 's' : ''} from the assignment`,
      data: {
        assignment_id: assignment_id,
        assignment_title: assignment.title,
        invitations_removed: removedStudents.length,
        emails_sent: successfulEmails,
        emails_failed: failedEmails.length,
        failed_emails: failedEmails.length > 0 ? failedEmails.map((item: EmailResult) => item.student_name) : [],
        removed_students: removedStudents,
        removal_reason: reason || null
      },
      success: true
    }, { status: 200 });

  } catch (error) {
    // Rollback transaction on any error
    if (databaseClient) {
      try {
        await databaseClient.query('ROLLBACK');
      } catch (rollbackError) {
        console.error("Error during rollback:", rollbackError);
      }
    }

    console.error("❌ [UNINVITE DEBUG] Error during student uninvitation:", error);
    
    // Handle specific database errors
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      if (errorMessage.includes('foreign key constraint') || errorMessage.includes('violates foreign key')) {
        return createErrorResponse(
          "Invalid assignment or student reference. Please verify the data and try again.",
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

      console.error("❌ [UNINVITE DEBUG] Specific database error details:", {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        assignmentId: assignment_id,
        supervisorId: supervisor_id,
        studentIds: student_ids
      });
    }

    return createErrorResponse(
      "An internal server error occurred while removing student invitations.",
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
// app/api/assignments/analytics/route.ts
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import client from "../../utils/db";

interface AnalyticsRequest {
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

export async function POST(req: NextRequest): Promise<NextResponse> {
  let requestBody: AnalyticsRequest;
  
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

  // Convert to number safely
  const supervisorIdNum = Number(supervisor_id);
  if (!Number.isInteger(supervisorIdNum) || supervisorIdNum <= 0) {
    return createErrorResponse("Supervisor ID must be a valid positive integer", "INVALID_SUPERVISOR_ID", 400);
  }

  try {
    // Verify supervisor exists and get their students
    const supervisorQuery = `SELECT students FROM supervisors WHERE id = $1`;
    const supervisorResult = await client.query(supervisorQuery, [supervisorIdNum]);
    
    if (supervisorResult.rows.length === 0) {
      return createErrorResponse("Supervisor not found", "SUPERVISOR_NOT_FOUND", 404);
    }

    const students = supervisorResult.rows[0].students || [];
    const allUserIds = [supervisorIdNum, ...students];

    // Get current date for calculations (use consistent timezone)
    const currentDate = new Date();
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(currentDate.getMonth() - 1);

    // Updated comprehensive analytics query with real submission-based status
    const analyticsQuery = `
      WITH assignment_submission_status AS (
        SELECT 
          a.id,
          a.is_active,
          a.due_date,
          a.created_at,
          COUNT(DISTINCT ai.student_id) as invited_students_count,
          COUNT(DISTINCT CASE WHEN asub.id IS NOT NULL THEN asub.student_id END) as submitted_students_count,
          CASE 
  -- Assignment is completed when ALL invited students have submitted
  WHEN COUNT(DISTINCT ai.student_id) > 0 AND 
       COUNT(DISTINCT CASE WHEN asub.id IS NOT NULL THEN asub.student_id END) = COUNT(DISTINCT ai.student_id) 
  THEN 'completed'
  
  -- Assignment is overdue when due date passed and not all students submitted
  WHEN a.is_active = true AND 
       a.due_date < NOW() AND 
       COUNT(DISTINCT ai.student_id) > 0 AND 
       COUNT(DISTINCT CASE WHEN asub.id IS NOT NULL THEN asub.student_id END) < COUNT(DISTINCT ai.student_id)
  THEN 'overdue'
  
  -- Assignment is active/pending when active and missing submissions (regardless of due date)
  WHEN a.is_active = true AND 
       COUNT(DISTINCT ai.student_id) > 0 AND 
       COUNT(DISTINCT CASE WHEN asub.id IS NOT NULL THEN asub.student_id END) < COUNT(DISTINCT ai.student_id)
  THEN 'active'
  
  -- Assignment is active when active and no students invited yet
  WHEN a.is_active = true AND COUNT(DISTINCT ai.student_id) = 0
  THEN 'active'
  
  -- Assignment is inactive when manually set to inactive
  WHEN a.is_active = false 
  THEN 'inactive'
  
  ELSE 'unknown'
END as real_status
        FROM assignments a
        LEFT JOIN assignment_invitations ai ON a.id = ai.assignment_id
        LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id AND ai.student_id = asub.student_id
        WHERE a.created_by = ANY($1::int[])
        GROUP BY a.id, a.is_active, a.due_date, a.created_at
      ),
      assignment_stats AS (
  SELECT 
    COUNT(*) as total_assignments,
    COUNT(CASE WHEN real_status = 'active' THEN 1 END) as active_assignments,
    COUNT(CASE WHEN real_status = 'inactive' THEN 1 END) as inactive_assignments,
    COUNT(CASE WHEN real_status = 'completed' THEN 1 END) as completed_assignments,
    COUNT(CASE WHEN real_status = 'overdue' THEN 1 END) as overdue_assignments,
    COUNT(CASE WHEN real_status = 'active' THEN 1 END) as pending_assignments -- Same as active
  FROM assignment_submission_status
),
      submission_stats AS (
        SELECT 
          COUNT(*) as total_submissions,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_submissions,
          COALESCE(ROUND(AVG(CASE WHEN score IS NOT NULL THEN score END)::numeric, 1), 0) as average_score
        FROM assignment_submissions asub
        INNER JOIN assignments a ON a.id = asub.assignment_id
        WHERE a.created_by = ANY($1::int[])
      ),
      invitation_stats AS (
        SELECT 
          COUNT(DISTINCT ai.student_id) as students_invited
        FROM assignment_invitations ai
        INNER JOIN assignments a ON a.id = ai.assignment_id
        WHERE a.created_by = ANY($1::int[])
      ),
      last_month_assignment_status AS (
        SELECT 
          a.id,
          a.is_active,
          a.due_date,
          a.created_at,
          COUNT(DISTINCT ai.student_id) as invited_students_count,
          COUNT(DISTINCT CASE WHEN asub.id IS NOT NULL THEN asub.student_id END) as submitted_students_count,
          CASE 
            WHEN COUNT(DISTINCT ai.student_id) > 0 AND 
                 COUNT(DISTINCT CASE WHEN asub.id IS NOT NULL THEN asub.student_id END) = COUNT(DISTINCT ai.student_id) 
            THEN 'completed'
            
            WHEN a.is_active = true AND 
                 a.due_date < NOW() AND 
                 COUNT(DISTINCT ai.student_id) > 0 AND 
                 COUNT(DISTINCT CASE WHEN asub.id IS NOT NULL THEN asub.student_id END) < COUNT(DISTINCT ai.student_id)
            THEN 'overdue'
            
            WHEN a.is_active = true AND 
                 a.due_date >= NOW() AND 
                 COUNT(DISTINCT ai.student_id) > 0 AND 
                 COUNT(DISTINCT CASE WHEN asub.id IS NOT NULL THEN asub.student_id END) < COUNT(DISTINCT ai.student_id)
            THEN 'pending'
            
            WHEN a.is_active = true AND a.due_date >= NOW() 
            THEN 'active'
            
            WHEN a.is_active = false 
            THEN 'inactive'
            
            ELSE 'unknown'
          END as real_status
        FROM assignments a
        LEFT JOIN assignment_invitations ai ON a.id = ai.assignment_id
        LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id AND ai.student_id = asub.student_id
        WHERE a.created_by = ANY($1::int[]) AND a.created_at >= $2
        GROUP BY a.id, a.is_active, a.due_date, a.created_at
      ),
      last_month_stats AS (
        SELECT 
          COUNT(*) as last_month_assignments,
          COUNT(CASE WHEN real_status = 'active' THEN 1 END) as last_month_active,
          COUNT(CASE WHEN real_status = 'inactive' THEN 1 END) as last_month_inactive,
          COUNT(CASE WHEN real_status = 'completed' THEN 1 END) as last_month_completed,
          COUNT(CASE WHEN real_status = 'overdue' THEN 1 END) as last_month_overdue,
          COUNT(CASE WHEN real_status = 'pending' THEN 1 END) as last_month_pending
        FROM last_month_assignment_status
      ),
      last_month_submission_stats AS (
        SELECT 
          COUNT(*) as last_month_submissions,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as last_month_pending_submissions,
          COALESCE(ROUND(AVG(CASE WHEN score IS NOT NULL THEN score END)::numeric, 1), 0) as last_month_average_score
        FROM assignment_submissions asub
        INNER JOIN assignments a ON a.id = asub.assignment_id
        WHERE a.created_by = ANY($1::int[]) 
          AND asub.created_at >= $2
      ),
      last_month_invitation_stats AS (
        SELECT 
          COUNT(DISTINCT ai.student_id) as last_month_students_invited
        FROM assignment_invitations ai
        INNER JOIN assignments a ON a.id = ai.assignment_id
        WHERE a.created_by = ANY($1::int[]) 
          AND ai.created_at >= $2
      )
      SELECT 
        COALESCE(ast.total_assignments, 0) as total_assignments,
        COALESCE(ast.active_assignments, 0) as active_assignments,
        COALESCE(ast.inactive_assignments, 0) as inactive_assignments,
        COALESCE(ast.completed_assignments, 0) as completed_assignments,
        COALESCE(ast.overdue_assignments, 0) as overdue_assignments,
        COALESCE(ast.pending_assignments, 0) as pending_submissions, -- Using pending_assignments for pending_submissions
        COALESCE(ss.total_submissions, 0) as total_submissions,
        COALESCE(ss.average_score, 0) as average_score,
        COALESCE(ins.students_invited, 0) as students_invited,
        COALESCE(lms.last_month_assignments, 0) as last_month_assignments,
        COALESCE(lms.last_month_active, 0) as last_month_active,
        COALESCE(lms.last_month_inactive, 0) as last_month_inactive,
        COALESCE(lms.last_month_completed, 0) as last_month_completed,
        COALESCE(lms.last_month_overdue, 0) as last_month_overdue,
        COALESCE(lms.last_month_pending, 0) as last_month_pending,
        COALESCE(lmss.last_month_submissions, 0) as last_month_submissions,
        COALESCE(lmss.last_month_pending_submissions, 0) as last_month_pending_submissions,
        COALESCE(lmss.last_month_average_score, 0) as last_month_average_score,
        COALESCE(lmins.last_month_students_invited, 0) as last_month_students_invited
      FROM assignment_stats ast
      CROSS JOIN submission_stats ss
      CROSS JOIN invitation_stats ins
      CROSS JOIN last_month_stats lms
      CROSS JOIN last_month_submission_stats lmss
      CROSS JOIN last_month_invitation_stats lmins
    `;

    const result = await client.query(analyticsQuery, [allUserIds, lastMonthDate]);
    
    if (result.rows.length === 0) {
      // Return zero analytics if no data found
      const emptyAnalytics = {
        total_assignments: 0,
        active_assignments: 0,
        inactive_assignments: 0,
        completed_assignments: 0,
        pending_submissions: 0,
        total_submissions: 0,
        overdue_assignments: 0,
        students_invited: 0,
        average_score: 0,
        percentage_change: {
          total_assignments: 0,
          active_assignments: 0,
          inactive_assignments: 0,
          completed_assignments: 0,
          pending_submissions: 0,
          total_submissions: 0,
          overdue_assignments: 0,
          students_invited: 0,
          average_score: 0,
        }
      };

      return NextResponse.json({
        success: true,
        data: emptyAnalytics
      }, { status: 200 });
    }

    const stats = result.rows[0];

    // Calculate percentage changes
    const calculatePercentageChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const analytics = {
      total_assignments: parseInt(stats.total_assignments),
      active_assignments: parseInt(stats.active_assignments),
      inactive_assignments: parseInt(stats.inactive_assignments),
      completed_assignments: parseInt(stats.completed_assignments),
      pending_submissions: parseInt(stats.pending_submissions), // This now represents assignments with pending submissions
      total_submissions: parseInt(stats.total_submissions),
      overdue_assignments: parseInt(stats.overdue_assignments),
      students_invited: parseInt(stats.students_invited),
      average_score: parseFloat(stats.average_score),
      percentage_change: {
        total_assignments: calculatePercentageChange(
          parseInt(stats.total_assignments),
          parseInt(stats.last_month_assignments)
        ),
        active_assignments: calculatePercentageChange(
          parseInt(stats.active_assignments),
          parseInt(stats.last_month_active)
        ),
        inactive_assignments: calculatePercentageChange(
          parseInt(stats.inactive_assignments),
          parseInt(stats.last_month_inactive)
        ),
        completed_assignments: calculatePercentageChange(
          parseInt(stats.completed_assignments),
          parseInt(stats.last_month_completed)
        ),
        pending_submissions: calculatePercentageChange(
          parseInt(stats.pending_submissions),
          parseInt(stats.last_month_pending)
        ),
        total_submissions: calculatePercentageChange(
          parseInt(stats.total_submissions),
          parseInt(stats.last_month_submissions)
        ),
        overdue_assignments: calculatePercentageChange(
          parseInt(stats.overdue_assignments),
          parseInt(stats.last_month_overdue)
        ),
        students_invited: calculatePercentageChange(
          parseInt(stats.students_invited),
          parseInt(stats.last_month_students_invited)
        ),
        average_score: calculatePercentageChange(
          parseFloat(stats.average_score),
          parseFloat(stats.last_month_average_score)
        ),
      }
    };

    // Debug logging
    console.log(`Analytics for supervisor ${supervisorIdNum}:`, {
      total_assignments: analytics.total_assignments,
      active_assignments: analytics.active_assignments,
      inactive_assignments: analytics.inactive_assignments,
      completed_assignments: analytics.completed_assignments,
      pending_submissions: analytics.pending_submissions,
      overdue_assignments: analytics.overdue_assignments,
      students_invited: analytics.students_invited,
      supervisor_students: students.length,
      all_user_ids: allUserIds
    });

    return NextResponse.json({
      success: true,
      data: analytics
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching assignment analytics:", error);
    return createErrorResponse(
      "An internal server error occurred while fetching analytics.",
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
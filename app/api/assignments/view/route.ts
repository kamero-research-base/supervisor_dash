// app/api/assignments/view/route.ts
import { NextRequest, NextResponse } from 'next/server';
import client from "../../utils/db";
import { parseAttachments } from "../../utils/attachmentParser";

interface ViewAssignmentRequest {
  id: string;
  supervisor_id?: number;
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
  let requestBody: ViewAssignmentRequest;
      
  // Safe JSON parsing
  try {
    const body = await req.text();
    if (!body.trim()) {
      return createErrorResponse(
        "Request body is empty. Please provide assignment ID.",
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

  console.log("Assignment ID:", id);

  try {
    // Build comprehensive query to get assignment details with related data
    let query = `
      SELECT 
        a.id,
        a.title,
        a.description,
        a.instructions,
        a.due_date,
        a.is_active,
        a.max_score,
        a.attachments,
        a.hashed_id,
        a.assignment_type,
        a.max_group_size,
        a.allow_students_create_groups,
        a.created_at AT TIME ZONE 'UTC' as created_at,
        a.updated_at AT TIME ZONE 'UTC' as updated_at,
        a.created_by,
        a.updated_by,
        COALESCE(creator.first_name || ' ' || creator.last_name, 'Unknown') as creator_name,
        COALESCE(updater.first_name || ' ' || updater.last_name, 'Unknown') as updater_name
      FROM assignments a
      LEFT JOIN supervisors creator ON creator.id = a.created_by
      LEFT JOIN supervisors updater ON updater.id = a.updated_by
      WHERE CAST(a.id AS TEXT) = $1 
    `;

    // Add supervisor authorization check if supervisor_id is provided
    let queryParams: (string | number[])[] = [id];
    if (supervisor_id) {
      // Check if supervisor has access to this assignment
      const accessQuery = `
        SELECT students FROM supervisors WHERE id = $1
      `;
      const supervisorResult = await client.query(accessQuery, [supervisor_id.toString()]);
      
      if (supervisorResult.rows.length === 0) {
        return createErrorResponse("Supervisor not found", "SUPERVISOR_NOT_FOUND", 404);
      }

      const students = supervisorResult.rows[0].students || [];
      const allUserIds = [parseInt(supervisor_id.toString()), ...students];

      query += ` AND a.created_by = ANY($2::int[])`;
      queryParams.push(allUserIds);
    }
   
    const assignmentResult = await client.query(query, queryParams);

    if (assignmentResult.rows.length === 0) {
      return createErrorResponse(
        "Assignment not found or access denied.",
        "ASSIGNMENT_NOT_FOUND",
        404
      );
    }

    const assignment = assignmentResult.rows[0];

    // Parse attachments JSON if it exists
    let attachments = parseAttachments(assignment.attachments);

    // Get submission statistics
    const submissionStatsQuery = `
      SELECT 
        COUNT(*) as total_submissions,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_submissions,
        COUNT(CASE WHEN status = 'graded' AND score IS NOT NULL THEN 1 END) as graded_submissions,
        ROUND(AVG(CASE WHEN score IS NOT NULL THEN score END)::numeric, 1) as average_score
      FROM assignment_submissions
      WHERE assignment_id = $1
    `;
    
    const submissionStatsResult = await client.query(submissionStatsQuery, [assignment.id]);
    const submissionStats = submissionStatsResult.rows[0] || {
      total_submissions: 0,
      pending_submissions: 0,
      graded_submissions: 0,
      average_score: 0
    };

    // Get invitation statistics
    const invitationStatsQuery = `
      SELECT 
        COUNT(*) as total_invitations,
        COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_invitations
      FROM assignment_invitations
      WHERE assignment_id = $1
    `;
    
    const invitationStatsResult = await client.query(invitationStatsQuery, [assignment.id]);
    const invitationStats = invitationStatsResult.rows[0] || {
      total_invitations: 0,
      accepted_invitations: 0
    };

    // Get detailed submissions data if there are any
    let submissions = [];
    if (parseInt(submissionStats.total_submissions) > 0) {
      const submissionsQuery = `
        SELECT 
          asub.id,
          asub.student_id,
          asub.group_id,
          asub.submission_text,
          asub.attachments,
          asub.status,
          asub.score,
          asub.feedback,
          asub.submitted_at AT TIME ZONE 'UTC' as submitted_at,
          asub.graded_at AT TIME ZONE 'UTC' as graded_at,
          COALESCE(st.first_name || ' ' || st.last_name, 'Unknown Student') as student_name,
          COALESCE(st.email, 'No email') as student_email,
          COALESCE(st.phone, 'No phone') as student_phone,
          ag.group_name
        FROM assignment_submissions asub
        LEFT JOIN students st ON st.id = asub.student_id
        LEFT JOIN assignment_groups ag ON asub.group_id = ag.id
        WHERE asub.assignment_id = $1
        ORDER BY asub.submitted_at DESC
      `;
      
      const submissionsResult = await client.query(submissionsQuery, [assignment.id]);
      submissions = submissionsResult.rows.map((sub: any) => ({
        ...sub,
        submitted_at: sub.submitted_at ? new Date(sub.submitted_at).toISOString() : null,
        graded_at: sub.graded_at ? new Date(sub.graded_at).toISOString() : null,
      }));
    }

    // Get invited students data (this should always run to show who was invited)
    let invitations = [];
    const invitationsQuery = `
      SELECT 
        ai.id,
        ai.student_id,
        ai.status,
        ai.invited_at AT TIME ZONE 'UTC' as invited_at,
        ai.responded_at AT TIME ZONE 'UTC' as responded_at,
        COALESCE(st.first_name || ' ' || st.last_name, 'Unknown Student') as student_name,
        COALESCE(st.email, 'No email') as student_email,
        COALESCE(st.phone, 'No phone') as student_phone
      FROM assignment_invitations ai
      LEFT JOIN students st ON st.id = ai.student_id
      WHERE ai.assignment_id = $1
      ORDER BY ai.invited_at DESC
    `;
    
    const invitationsResult = await client.query(invitationsQuery, [assignment.id]);
    invitations = invitationsResult.rows.map((inv: any) => ({
      ...inv,
      invited_at: new Date(inv.invited_at).toISOString(),
      responded_at: inv.responded_at ? new Date(inv.responded_at).toISOString() : null,
    }));

    // Get group data for group assignments
    let groups = [];
    let groupStats = {
      total_groups: 0,
      groups_with_submissions: 0,
      students_in_groups: 0,
      students_without_groups: 0
    };

    if (assignment.assignment_type === 'group') {
      // Get all groups for this assignment with member details
      const groupsQuery = `
        SELECT 
          ag.id,
          ag.group_name,
          ag.created_by_supervisor_id,
          ag.created_by_student_id,
          ag.max_members,
          ag.created_at AT TIME ZONE 'UTC' as created_at,
          ag.updated_at AT TIME ZONE 'UTC' as updated_at,
          json_agg(
            json_build_object(
              'student_id', s.id,
              'first_name', s.first_name,
              'last_name', s.last_name,
              'email', s.email,
              'joined_at', agm.joined_at AT TIME ZONE 'UTC'
            ) ORDER BY s.first_name, s.last_name
          ) FILTER (WHERE s.id IS NOT NULL) as members,
          COUNT(agm.student_id) as member_count,
          CASE WHEN EXISTS(
            SELECT 1 FROM assignment_submissions sub 
            WHERE sub.group_id = ag.id
          ) THEN true ELSE false END as has_submission
        FROM assignment_groups ag
        LEFT JOIN assignment_group_members agm ON ag.id = agm.group_id
        LEFT JOIN students s ON agm.student_id = s.id
        WHERE ag.assignment_id = $1
        GROUP BY ag.id, ag.group_name, ag.created_by_supervisor_id, ag.created_by_student_id, ag.max_members, ag.created_at, ag.updated_at
        ORDER BY ag.created_at DESC
      `;
      
      const groupsResult = await client.query(groupsQuery, [assignment.id]);
      groups = groupsResult.rows.map((group: any) => ({
        ...group,
        created_at: new Date(group.created_at).toISOString(),
        updated_at: new Date(group.updated_at).toISOString(),
        member_count: parseInt(group.member_count) || 0,
        members: group.members || []
      }));

      // Calculate group statistics
      const totalGroups = groups.length;
      const groupsWithSubmissions = groups.filter((g: any) => g.has_submission).length;
      const studentsInGroups = groups.reduce((sum: number, group: any) => sum + group.member_count, 0);

      // Get count of invited students not in any group
      const studentsWithoutGroupsQuery = `
        SELECT COUNT(DISTINCT ai.student_id) as count
        FROM assignment_invitations ai
        WHERE ai.assignment_id = $1 
          AND ai.status = 'accepted'
          AND NOT EXISTS (
            SELECT 1 FROM assignment_group_members agm
            JOIN assignment_groups ag ON agm.group_id = ag.id
            WHERE ag.assignment_id = $1 AND agm.student_id = ai.student_id
          )
      `;
      
      const studentsWithoutGroupsResult = await client.query(studentsWithoutGroupsQuery, [assignment.id]);
      const studentsWithoutGroups = parseInt(studentsWithoutGroupsResult.rows[0]?.count) || 0;

      groupStats = {
        total_groups: totalGroups,
        groups_with_submissions: groupsWithSubmissions,
        students_in_groups: studentsInGroups,
        students_without_groups: studentsWithoutGroups
      };
    }

    // Use the actual counts from our separate queries
    const actualTotalInvitations = parseInt(invitationStats.total_invitations) || 0;
    const actualAcceptedInvitations = parseInt(invitationStats.accepted_invitations) || 0;

    // Format the response
    const formattedAssignment = {
      ...assignment,
      attachments: attachments,
      total_submissions: parseInt(submissionStats.total_submissions) || 0,
      pending_submissions: parseInt(submissionStats.pending_submissions) || 0,
      graded_submissions: parseInt(submissionStats.graded_submissions) || 0,
      average_score: submissionStats.average_score ? parseFloat(submissionStats.average_score) : 0,
      total_invitations: actualTotalInvitations,
      accepted_invitations: actualAcceptedInvitations,
      max_score: parseInt(assignment.max_score),
      max_group_size: assignment.max_group_size ? parseInt(assignment.max_group_size) : null,
      allow_students_create_groups: Boolean(assignment.allow_students_create_groups),
      is_active: Boolean(assignment.is_active),
      created_at: new Date(assignment.created_at).toISOString(),
      updated_at: new Date(assignment.updated_at).toISOString(),
      submissions: submissions,
      invitations: invitations,
      groups: groups,
      group_stats: groupStats
    };

    // Debug logging
    console.log(`Assignment ${id} view data:`, {
      id: assignment.id,
      title: assignment.title,
      assignment_type: assignment.assignment_type,
      total_invitations: actualTotalInvitations,
      invitations_found: invitations.length,
      total_submissions: parseInt(submissionStats.total_submissions) || 0,
      accepted_invitations: actualAcceptedInvitations,
      total_groups: groupStats.total_groups,
      students_in_groups: groupStats.students_in_groups,
      students_without_groups: groupStats.students_without_groups
    });

    return NextResponse.json({
      success: true,
      data: formattedAssignment
    }, { status: 200 });

  } catch (error) {
    console.error("Error retrieving assignment:", error);
    return createErrorResponse(
      "An internal server error occurred while retrieving the assignment.",
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
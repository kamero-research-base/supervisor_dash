// app/api/groups/route.ts
import { NextRequest, NextResponse } from "next/server";
import client from "../utils/db";

interface GroupRequest {
  assignment_id: string;
  group_name: string;
  members: string[]; // student IDs
  created_by: string;
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

// Validation helper functions
const validateRequired = (value: any, fieldName: string): string | null => {
  if (value === undefined || value === null || value === '') {
    return `${fieldName} is required and cannot be empty`;
  }
  return null;
};

const validateGroupName = (name: string): string | null => {
  if (!name) return "Group name is required";
  
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return "Group name must be at least 2 characters long";
  }
  if (trimmed.length > 100) {
    return "Group name cannot exceed 100 characters";
  }
  
  return null;
};

const validateMembers = (members: string[]): string | null => {
  if (!members || members.length === 0) {
    return "At least one member is required";
  }
  
  if (members.length < 2) {
    return "Group must have at least 2 members";
  }
  
  // Check for duplicates
  const uniqueMembers = new Set(members);
  if (uniqueMembers.size !== members.length) {
    return "Duplicate members are not allowed";
  }
  
  return null;
};

// Create a new group
export async function POST(req: NextRequest): Promise<NextResponse> {
  let dbClient;
  
  try {
    const body = await req.json();
    
    const groupData: GroupRequest = {
      assignment_id: body.assignment_id || '',
      group_name: body.group_name || '',
      members: body.members || [],
      created_by: body.created_by || ''
    };

    // Validation
    const validationErrors: Record<string, string> = {};

    const assignmentIdError = validateRequired(groupData.assignment_id, 'Assignment ID');
    if (assignmentIdError) validationErrors.assignment_id = assignmentIdError;

    const groupNameError = validateGroupName(groupData.group_name);
    if (groupNameError) validationErrors.group_name = groupNameError;

    const membersError = validateMembers(groupData.members);
    if (membersError) validationErrors.members = membersError;

    const createdByError = validateRequired(groupData.created_by, 'Creator ID');
    if (createdByError) validationErrors.created_by = createdByError;

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

    // Verify assignment exists and is a group assignment
    const assignmentQuery = `
      SELECT id, title, assignment_type, max_group_size, allow_students_create_groups 
      FROM assignments 
      WHERE id = $1 AND assignment_type = 'group'
    `;
    const assignmentResult = await dbClient.query(assignmentQuery, [parseInt(groupData.assignment_id)]);
    
    if (assignmentResult.rows.length === 0) {
      await dbClient.query('ROLLBACK');
      return createErrorResponse("Assignment not found or is not a group assignment", "ASSIGNMENT_NOT_FOUND", 404);
    }

    const assignment = assignmentResult.rows[0];

    // Check if group size exceeds maximum allowed
    if (groupData.members.length > assignment.max_group_size) {
      await dbClient.query('ROLLBACK');
      return createErrorResponse(
        `Group size (${groupData.members.length}) exceeds maximum allowed (${assignment.max_group_size})`,
        "GROUP_SIZE_EXCEEDED"
      );
    }

    // Verify all members are valid students
    const studentsQuery = `
      SELECT id, first_name, last_name 
      FROM students 
      WHERE id = ANY($1::int[])
    `;
    const studentsResult = await dbClient.query(studentsQuery, [groupData.members.map(id => parseInt(id))]);
    
    if (studentsResult.rows.length !== groupData.members.length) {
      await dbClient.query('ROLLBACK');
      return createErrorResponse("One or more students not found", "STUDENTS_NOT_FOUND", 404);
    }

    // Check if any member is already in a group for this assignment
    const existingGroupQuery = `
      SELECT agm.student_id, ag.group_name
      FROM assignment_group_members agm
      JOIN assignment_groups ag ON agm.group_id = ag.id
      WHERE ag.assignment_id = $1 AND agm.student_id = ANY($2::int[])
    `;
    const existingGroupResult = await dbClient.query(existingGroupQuery, [
      parseInt(groupData.assignment_id),
      groupData.members.map(id => parseInt(id))
    ]);

    if (existingGroupResult.rows.length > 0) {
      await dbClient.query('ROLLBACK');
      const conflictingStudent = existingGroupResult.rows[0];
      return createErrorResponse(
        `Student is already in group "${conflictingStudent.group_name}"`,
        "STUDENT_ALREADY_IN_GROUP",
        409
      );
    }

    // Check for duplicate group name within the same assignment
    const duplicateNameQuery = `
      SELECT id, group_name 
      FROM assignment_groups 
      WHERE assignment_id = $1 AND LOWER(TRIM(group_name)) = LOWER(TRIM($2))
    `;
    const duplicateNameResult = await dbClient.query(duplicateNameQuery, [
      parseInt(groupData.assignment_id),
      groupData.group_name
    ]);

    if (duplicateNameResult.rows.length > 0) {
      await dbClient.query('ROLLBACK');
      return createErrorResponse(
        "A group with this name already exists for this assignment",
        "DUPLICATE_GROUP_NAME",
        409
      );
    }

    // Create the group
    const insertGroupQuery = `
      INSERT INTO assignment_groups (assignment_id, group_name, created_by_supervisor_id, max_members, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `;
    const groupResult = await dbClient.query(insertGroupQuery, [
      parseInt(groupData.assignment_id),
      groupData.group_name.trim(),
      parseInt(groupData.created_by),
      groupData.members.length // Set max_members to the actual number of members being created
    ]);

    const groupId = groupResult.rows[0].id;

    // Add members to the group
    const insertMembersQuery = `
      INSERT INTO assignment_group_members (group_id, student_id, joined_at)
      VALUES ${groupData.members.map((_, index) => `($1, $${index + 2}, NOW())`).join(', ')}
      RETURNING *
    `;
    const memberIds = groupData.members.map(id => parseInt(id));
    await dbClient.query(insertMembersQuery, [groupId, ...memberIds]);

    // Get the complete group data with member details
    const completeGroupQuery = `
      SELECT 
        ag.id,
        ag.assignment_id,
        ag.group_name,
        ag.created_by,
        ag.created_at,
        ag.updated_at,
        json_agg(
          json_build_object(
            'student_id', s.id,
            'first_name', s.first_name,
            'last_name', s.last_name,
            'email', s.email,
            'joined_at', agm.joined_at
          ) ORDER BY s.first_name, s.last_name
        ) as members
      FROM assignment_groups ag
      JOIN assignment_group_members agm ON ag.id = agm.group_id
      JOIN students s ON agm.student_id = s.id
      WHERE ag.id = $1
      GROUP BY ag.id, ag.assignment_id, ag.group_name, ag.created_by, ag.created_at, ag.updated_at
    `;
    const completeGroupResult = await dbClient.query(completeGroupQuery, [groupId]);

    // Commit the transaction
    await dbClient.query('COMMIT');

    // Log the successful creation
    console.log(`Group created successfully: ID ${groupId}, Name: "${groupData.group_name}", Assignment: ${groupData.assignment_id}, Members: ${groupData.members.length}, Creator: ${groupData.created_by}, Timestamp: ${new Date().toISOString()}`);

    return NextResponse.json({
      message: "Group created successfully",
      data: {
        group: completeGroupResult.rows[0],
        members_count: groupData.members.length
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

    console.error("Error during group creation:", error);
    
    // Handle specific database errors
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      if (errorMessage.includes('foreign key constraint') || errorMessage.includes('violates foreign key')) {
        return createErrorResponse(
          "Invalid reference data. Please ensure all IDs are valid.",
          "FOREIGN_KEY_VIOLATION"
        );
      }
      
      if (errorMessage.includes('unique constraint') || errorMessage.includes('duplicate key')) {
        return createErrorResponse(
          "A group with similar details already exists.",
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
      "An internal server error occurred while creating the group.",
      "INTERNAL_SERVER_ERROR",
      500
    );
  }
}

// Get all groups for an assignment
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get('assignment_id');

    if (!assignmentId) {
      return createErrorResponse("Assignment ID is required", "MISSING_ASSIGNMENT_ID");
    }

    const dbClient = client;
    
    // Get all groups for the assignment with member details
    const groupsQuery = `
      SELECT 
        ag.id,
        ag.assignment_id,
        ag.group_name,
        ag.created_by_supervisor_id,
        ag.created_by_student_id,
        ag.max_members,
        ag.created_at,
        ag.updated_at,
        json_agg(
          json_build_object(
            'student_id', s.id,
            'first_name', s.first_name,
            'last_name', s.last_name,
            'email', s.email,
            'joined_at', agm.joined_at
          ) ORDER BY s.first_name, s.last_name
        ) as members,
        COUNT(agm.student_id) as member_count
      FROM assignment_groups ag
      LEFT JOIN assignment_group_members agm ON ag.id = agm.group_id
      LEFT JOIN students s ON agm.student_id = s.id
      WHERE ag.assignment_id = $1
      GROUP BY ag.id, ag.assignment_id, ag.group_name, ag.created_by_supervisor_id, ag.created_by_student_id, ag.max_members, ag.created_at, ag.updated_at
      ORDER BY ag.created_at DESC
    `;
    
    const result = await dbClient.query(groupsQuery, [parseInt(assignmentId)]);

    return NextResponse.json({
      message: "Groups retrieved successfully",
      data: {
        groups: result.rows,
        total_groups: result.rows.length
      },
      success: true
    });

  } catch (error) {
    console.error("Error fetching groups:", error);
    return createErrorResponse(
      "An error occurred while fetching groups.",
      "FETCH_ERROR",
      500
    );
  }
}

// Handle other HTTP methods
export async function PUT(): Promise<NextResponse> {
  return createErrorResponse(
    "Method not allowed. Use specific group endpoints for updates.",
    "METHOD_NOT_ALLOWED",
    405
  );
}

export async function DELETE(): Promise<NextResponse> {
  return createErrorResponse(
    "Method not allowed. Use specific group endpoints for deletion.",
    "METHOD_NOT_ALLOWED",
    405
  );
}
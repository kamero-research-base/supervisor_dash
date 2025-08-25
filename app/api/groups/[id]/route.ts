// app/api/groups/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import client from "../../utils/db";

interface GroupUpdateRequest {
  group_name?: string;
  members?: string[]; // student IDs
  updated_by: string;
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
const validateGroupName = (name: string): string | null => {
  if (!name) return null; // Optional for updates
  
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

// Get specific group details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const groupId = params.id;

    if (!groupId) {
      return createErrorResponse("Group ID is required", "MISSING_GROUP_ID");
    }

    const dbClient = client;
    
    // Get group details with member information
    const groupQuery = `
      SELECT 
        ag.id,
        ag.assignment_id,
        ag.group_name,
        ag.created_by,
        ag.created_at,
        ag.updated_at,
        a.title as assignment_title,
        a.assignment_type,
        a.max_group_size,
        json_agg(
          json_build_object(
            'student_id', s.id,
            'first_name', s.first_name,
            'last_name', s.last_name,
            'email', s.email,
            'joined_at', agm.joined_at
          ) ORDER BY s.first_name, s.last_name
        ) FILTER (WHERE s.id IS NOT NULL) as members,
        COUNT(agm.student_id) as member_count
      FROM assignment_groups ag
      LEFT JOIN assignment_group_members agm ON ag.id = agm.group_id
      LEFT JOIN students s ON agm.student_id = s.id
      LEFT JOIN assignments a ON ag.assignment_id = a.id
      WHERE ag.id = $1
      GROUP BY ag.id, ag.assignment_id, ag.group_name, ag.created_by, ag.created_at, ag.updated_at,
               a.title, a.assignment_type, a.max_group_size
    `;
    
    const result = await dbClient.query(groupQuery, [parseInt(groupId)]);

    if (result.rows.length === 0) {
      return createErrorResponse("Group not found", "GROUP_NOT_FOUND", 404);
    }

    return NextResponse.json({
      message: "Group retrieved successfully",
      data: {
        group: result.rows[0]
      },
      success: true
    });

  } catch (error) {
    console.error("Error fetching group:", error);
    return createErrorResponse(
      "An error occurred while fetching the group.",
      "FETCH_ERROR",
      500
    );
  }
}

// Update group details
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  let dbClient;
  
  try {
    const groupId = params.id;
    const body = await req.json();

    if (!groupId) {
      return createErrorResponse("Group ID is required", "MISSING_GROUP_ID");
    }
    
    const updateData: GroupUpdateRequest = {
      group_name: body.group_name,
      members: body.members,
      updated_by: body.updated_by || ''
    };

    // Validation
    const validationErrors: Record<string, string> = {};

    if (!updateData.updated_by) {
      validationErrors.updated_by = "Updated by field is required";
    }

    if (updateData.group_name) {
      const groupNameError = validateGroupName(updateData.group_name);
      if (groupNameError) validationErrors.group_name = groupNameError;
    }

    if (updateData.members) {
      const membersError = validateMembers(updateData.members);
      if (membersError) validationErrors.members = membersError;
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

    // Verify group exists and get current details
    const existingGroupQuery = `
      SELECT ag.*, a.max_group_size, a.assignment_type
      FROM assignment_groups ag
      JOIN assignments a ON ag.assignment_id = a.id
      WHERE ag.id = $1
    `;
    const existingGroupResult = await dbClient.query(existingGroupQuery, [parseInt(groupId)]);
    
    if (existingGroupResult.rows.length === 0) {
      await dbClient.query('ROLLBACK');
      return createErrorResponse("Group not found", "GROUP_NOT_FOUND", 404);
    }

    const existingGroup = existingGroupResult.rows[0];

    // Check if updating members
    if (updateData.members) {
      // Check if new group size exceeds maximum allowed
      if (updateData.members.length > existingGroup.max_group_size) {
        await dbClient.query('ROLLBACK');
        return createErrorResponse(
          `Group size (${updateData.members.length}) exceeds maximum allowed (${existingGroup.max_group_size})`,
          "GROUP_SIZE_EXCEEDED"
        );
      }

      // Verify all new members are valid students
      const studentsQuery = `
        SELECT id, first_name, last_name 
        FROM students 
        WHERE id = ANY($1::int[])
      `;
      const studentsResult = await dbClient.query(studentsQuery, [updateData.members.map(id => parseInt(id))]);
      
      if (studentsResult.rows.length !== updateData.members.length) {
        await dbClient.query('ROLLBACK');
        return createErrorResponse("One or more students not found", "STUDENTS_NOT_FOUND", 404);
      }

      // Check if any new member is already in another group for this assignment
      const conflictingMembersQuery = `
        SELECT agm.student_id, ag.group_name
        FROM assignment_group_members agm
        JOIN assignment_groups ag ON agm.group_id = ag.id
        WHERE ag.assignment_id = $1 AND ag.id != $2 AND agm.student_id = ANY($3::int[])
      `;
      const conflictingMembersResult = await dbClient.query(conflictingMembersQuery, [
        existingGroup.assignment_id,
        parseInt(groupId),
        updateData.members.map(id => parseInt(id))
      ]);

      if (conflictingMembersResult.rows.length > 0) {
        await dbClient.query('ROLLBACK');
        const conflictingStudent = conflictingMembersResult.rows[0];
        return createErrorResponse(
          `Student is already in group "${conflictingStudent.group_name}"`,
          "STUDENT_ALREADY_IN_GROUP",
          409
        );
      }

      // Remove existing members
      await dbClient.query('DELETE FROM assignment_group_members WHERE group_id = $1', [parseInt(groupId)]);

      // Add new members
      if (updateData.members.length > 0) {
        const insertMembersQuery = `
          INSERT INTO assignment_group_members (group_id, student_id, joined_at)
          VALUES ${updateData.members.map((_, index) => `($1, $${index + 2}, NOW())`).join(', ')}
        `;
        const memberIds = updateData.members.map(id => parseInt(id));
        await dbClient.query(insertMembersQuery, [parseInt(groupId), ...memberIds]);
      }
    }

    // Check if updating group name
    if (updateData.group_name) {
      // Check for duplicate group name within the same assignment
      const duplicateNameQuery = `
        SELECT id, group_name 
        FROM assignment_groups 
        WHERE assignment_id = $1 AND id != $2 AND LOWER(TRIM(group_name)) = LOWER(TRIM($3))
      `;
      const duplicateNameResult = await dbClient.query(duplicateNameQuery, [
        existingGroup.assignment_id,
        parseInt(groupId),
        updateData.group_name
      ]);

      if (duplicateNameResult.rows.length > 0) {
        await dbClient.query('ROLLBACK');
        return createErrorResponse(
          "A group with this name already exists for this assignment",
          "DUPLICATE_GROUP_NAME",
          409
        );
      }

      // Update group name
      await dbClient.query(
        'UPDATE assignment_groups SET group_name = $1, updated_at = NOW() WHERE id = $2',
        [updateData.group_name.trim(), parseInt(groupId)]
      );
    }

    // Get updated group data with member details
    const updatedGroupQuery = `
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
        ) FILTER (WHERE s.id IS NOT NULL) as members,
        COUNT(agm.student_id) as member_count
      FROM assignment_groups ag
      LEFT JOIN assignment_group_members agm ON ag.id = agm.group_id
      LEFT JOIN students s ON agm.student_id = s.id
      WHERE ag.id = $1
      GROUP BY ag.id, ag.assignment_id, ag.group_name, ag.created_by, ag.created_at, ag.updated_at
    `;
    const updatedResult = await dbClient.query(updatedGroupQuery, [parseInt(groupId)]);

    // Commit the transaction
    await dbClient.query('COMMIT');

    // Log the successful update
    console.log(`Group updated successfully: ID ${groupId}, Name: "${updateData.group_name || 'unchanged'}", Members: ${updateData.members?.length || 'unchanged'}, Updated by: ${updateData.updated_by}, Timestamp: ${new Date().toISOString()}`);

    return NextResponse.json({
      message: "Group updated successfully",
      data: {
        group: updatedResult.rows[0]
      },
      success: true
    });

  } catch (error) {
    // Rollback transaction on any error
    if (dbClient) {
      try {
        await dbClient.query('ROLLBACK');
      } catch (rollbackError) {
        console.error("Error during rollback:", rollbackError);
      }
    }

    console.error("Error during group update:", error);
    
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
      "An internal server error occurred while updating the group.",
      "INTERNAL_SERVER_ERROR",
      500
    );
  }
}

// Delete group
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  let dbClient;
  
  try {
    const groupId = params.id;

    if (!groupId) {
      return createErrorResponse("Group ID is required", "MISSING_GROUP_ID");
    }

    // Start database transaction
    dbClient = client;
    await dbClient.query('BEGIN');

    // Check if group exists
    const groupQuery = `SELECT id, group_name, assignment_id FROM assignment_groups WHERE id = $1`;
    const groupResult = await dbClient.query(groupQuery, [parseInt(groupId)]);
    
    if (groupResult.rows.length === 0) {
      await dbClient.query('ROLLBACK');
      return createErrorResponse("Group not found", "GROUP_NOT_FOUND", 404);
    }

    const group = groupResult.rows[0];

    // Check if group has any submissions
    const submissionQuery = `
      SELECT id FROM assignment_submissions 
      WHERE group_id = $1
    `;
    const submissionResult = await dbClient.query(submissionQuery, [parseInt(groupId)]);

    if (submissionResult.rows.length > 0) {
      await dbClient.query('ROLLBACK');
      return createErrorResponse(
        "Cannot delete group that has submissions. Please remove submissions first.",
        "GROUP_HAS_SUBMISSIONS",
        409
      );
    }

    // Delete group members first (due to foreign key constraints)
    await dbClient.query('DELETE FROM assignment_group_members WHERE group_id = $1', [parseInt(groupId)]);

    // Delete the group
    await dbClient.query('DELETE FROM assignment_groups WHERE id = $1', [parseInt(groupId)]);

    // Commit the transaction
    await dbClient.query('COMMIT');

    // Log the successful deletion
    console.log(`Group deleted successfully: ID ${groupId}, Name: "${group.group_name}", Assignment: ${group.assignment_id}, Timestamp: ${new Date().toISOString()}`);

    return NextResponse.json({
      message: "Group deleted successfully",
      data: {
        deleted_group_id: parseInt(groupId),
        group_name: group.group_name
      },
      success: true
    });

  } catch (error) {
    // Rollback transaction on any error
    if (dbClient) {
      try {
        await dbClient.query('ROLLBACK');
      } catch (rollbackError) {
        console.error("Error during rollback:", rollbackError);
      }
    }

    console.error("Error during group deletion:", error);
    
    // Handle specific database errors
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      if (errorMessage.includes('foreign key constraint') || errorMessage.includes('violates foreign key')) {
        return createErrorResponse(
          "Cannot delete group due to related data. Please remove related submissions first.",
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
    }

    return createErrorResponse(
      "An internal server error occurred while deleting the group.",
      "INTERNAL_SERVER_ERROR",
      500
    );
  }
}

// Handle other HTTP methods
export async function POST(): Promise<NextResponse> {
  return createErrorResponse(
    "Method not allowed. Use /api/groups for creating new groups.",
    "METHOD_NOT_ALLOWED",
    405
  );
}
//app/api/auth/supervisor-profile/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import client from "../../../utils/db";

// GET supervisor profile by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: supervisorId } = await params;

    if (!supervisorId) {
      return NextResponse.json(
        { success: false, message: "Supervisor ID is required" },
        { status: 400 }
      );
    }

    // Query supervisor data with institutional hierarchy
    const sql = `
      SELECT 
        s.id,
        s.first_name,
        s.last_name,
        s.email,
        s.phone,
        s.profile_picture,
        s.biography,
        s.status,
        s.hashed_id,
        s.created_at,
        s.updated_at,
        s.verification_code,
        s.password,
        d.id as department_id,
        d.name as department_name,
        sch.id as school_id,
        sch.name as school_name,
        c.id as college_id,
        c.name as college_name,
        i.id as institution_id,
        i.name as institution_name
      FROM supervisors s
      LEFT JOIN departments d ON CAST(s.department AS INTEGER) = d.id
      LEFT JOIN schools sch ON CAST(d.school AS INTEGER) = sch.id
      LEFT JOIN colleges c ON CAST(sch.college AS INTEGER) = c.id
      LEFT JOIN institutions i ON CAST(c.institution AS INTEGER) = i.id
      WHERE s.id = $1
    `;
    
    const result = await client.query(sql, [supervisorId]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "Supervisor not found" },
        { status: 404 }
      );
    }

    const supervisor = result.rows[0];

    // Transform database fields to match frontend expectations
    const supervisorProfile = {
      id: supervisor.id,
      first_name: supervisor.first_name || "",
      last_name: supervisor.last_name || "",
      bio: supervisor.biography || "", // Use actual biography field from database
      email: supervisor.email,
      phone_number: supervisor.phone || "",
      photo_url: supervisor.profile_picture || "",
      last_login: supervisor.updated_at, // Using updated_at as last_login
      status: supervisor.status?.toLowerCase() === 'active',
      created_at: supervisor.created_at,
      updated_at: supervisor.updated_at,
      department_id: supervisor.department_id,
      department_name: supervisor.department_name || "",
      school_name: supervisor.school_name || "",
      college_name: supervisor.college_name || "",
      institution_name: supervisor.institution_name || ""
    };

    // Remove sensitive data
    delete supervisor.password;
    delete supervisor.verification_code;

    return NextResponse.json(
      { 
        success: true, 
        supervisor: supervisorProfile,
        message: "Supervisor profile fetched successfully" 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Supervisor profile fetch error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Server error: " + (error instanceof Error ? error.message : "Unknown error occurred.") 
      },
      { status: 500 }
    );
  }
}

// UPDATE supervisor profile
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: supervisorIdString } = await params;
    const body = await req.json();

    const supervisorId = parseInt(supervisorIdString, 10);
    if (isNaN(supervisorId)) {
      return NextResponse.json(
        { success: false, message: "Invalid Supervisor ID format. Must be a number." },
        { status: 400 }
      );
    }

    const { first_name, last_name, email, phone_number, bio } = body;

    // Update supervisor data
    const updateSql = `
      UPDATE supervisors 
      SET 
        first_name = $1,
        last_name = $2,
        email = $3,
        phone = $4,
        biography = $5,
        updated_at = NOW()
      WHERE id = $6
      RETURNING id, first_name, last_name, email, phone, profile_picture, biography, status, created_at, updated_at, department
    `;

    const result = await client.query(updateSql, [
      first_name,
      last_name,
      email,
      phone_number,
      bio || null, // Store bio in biography field, use null if empty
      supervisorId
    ]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "Supervisor not found or no changes made" },
        { status: 404 }
      );
    }

    const updatedSupervisor = result.rows[0];

    // Get institutional hierarchy for the response
    const hierarchySql = `
      SELECT 
        d.id as department_id,
        d.name as department_name,
        sch.id as school_id,
        sch.name as school_name,
        c.id as college_id,
        c.name as college_name,
        i.id as institution_id,
        i.name as institution_name
      FROM departments d
      LEFT JOIN schools sch ON CAST(d.school AS INTEGER) = sch.id
      LEFT JOIN colleges c ON CAST(sch.college AS INTEGER) = c.id
      LEFT JOIN institutions i ON CAST(c.institution AS INTEGER) = i.id
      WHERE d.id = CAST($1 AS INTEGER)
    `;

    const hierarchyResult = await client.query(hierarchySql, [updatedSupervisor.department]);
    const hierarchy = hierarchyResult.rows[0] || {};

    // Transform response to match frontend expectations
    const supervisorProfile = {
      id: updatedSupervisor.id,
      first_name: updatedSupervisor.first_name || "",
      last_name: updatedSupervisor.last_name || "",
      bio: updatedSupervisor.biography || "", // Use actual biography field from database
      email: updatedSupervisor.email,
      phone_number: updatedSupervisor.phone || "",
      photo_url: updatedSupervisor.profile_picture || "",
      last_login: updatedSupervisor.updated_at,
      status: updatedSupervisor.status?.toLowerCase() === 'active',
      created_at: updatedSupervisor.created_at,
      updated_at: updatedSupervisor.updated_at,
      department_id: hierarchy.department_id,
      department_name: hierarchy.department_name || "",
      school_name: hierarchy.school_name || "",
      college_name: hierarchy.college_name || "",
      institution_name: hierarchy.institution_name || ""
    };

    return NextResponse.json(
      {
        success: true,
        supervisor: supervisorProfile,
        message: "Supervisor profile updated successfully"
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Supervisor profile update error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Server error: " + (error instanceof Error ? error.message : "Unknown error occurred.")
      },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import client from "../../../utils/db";

interface SupervisorProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  profile_picture?: string;
  status: string;
  department_id?: number;
  department_name?: string;
  school_id?: number;
  school_name?: string;
  college_id?: number;
  college_name?: string;
  institution_id?: number;
  institution_name?: string;
  bio?: string;
  specialization?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

// GET supervisor profile by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: supervisorId } = await params;

  // Validate supervisor ID
  if (!supervisorId || isNaN(Number(supervisorId))) {
    return NextResponse.json(
      { success: false, message: "Invalid supervisor ID" },
      { status: 400 }
    );
  }

  try {
    // Query supervisor with institutional hierarchy and additional profile data
    const sql = `
      SELECT 
        s.id, 
        s.first_name, 
        s.last_name, 
        s.email, 
        s.phone, 
        s.profile_picture, 
        s.status,
        s.biography,
        s.specialization,
        s.created_at,
        s.updated_at,
        s.last_login,
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
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Supervisor not found" },
        { status: 404 }
      );
    }

    const supervisor = result.rows[0];

    // Format the supervisor profile data
    const supervisorProfile: SupervisorProfile = {
      id: supervisor.id,
      first_name: supervisor.first_name,
      last_name: supervisor.last_name,
      email: supervisor.email,
      phone: supervisor.phone || '',
      profile_picture: supervisor.profile_picture,
      status: supervisor.status,
      department_id: supervisor.department_id,
      department_name: supervisor.department_name,
      school_id: supervisor.school_id,
      school_name: supervisor.school_name,
      college_id: supervisor.college_id,
      college_name: supervisor.college_name,
      institution_id: supervisor.institution_id,
      institution_name: supervisor.institution_name,
      bio: supervisor.bio,
      specialization: supervisor.specialization || 'Research Supervision',
      created_at: supervisor.created_at,
      updated_at: supervisor.updated_at,
      last_login: supervisor.last_login,
    };

    return NextResponse.json(
      { 
        success: true, 
        supervisor: supervisorProfile,
        message: "Supervisor profile retrieved successfully"
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

// PUT - Update supervisor profile
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: supervisorId } = await params;

  // Validate supervisor ID
  if (!supervisorId || isNaN(Number(supervisorId))) {
    return NextResponse.json(
      { success: false, message: "Invalid supervisor ID" },
      { status: 400 }
    );
  }

  try {
    const requestBody = await req.json();
    const { first_name, last_name, phone, bio, specialization } = requestBody;

    // Validate required fields
    if (!first_name || !last_name) {
      return NextResponse.json(
        { success: false, message: "First name and last name are required" },
        { status: 400 }
      );
    }

    // Update supervisor profile
    const updateSql = `
      UPDATE supervisors 
      SET 
        first_name = $1,
        last_name = $2,
        phone = $3,
        bio = $4,
        specialization = $5,
        updated_at = NOW()
      WHERE id = $6
      RETURNING id, first_name, last_name, email, phone, bio, specialization, updated_at
    `;

    const updateResult = await client.query(updateSql, [
      first_name,
      last_name,
      phone || '',
      bio || '',
      specialization || 'Research Supervision',
      supervisorId
    ]);

    if (updateResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Supervisor not found or update failed" },
        { status: 404 }
      );
    }

    const updatedSupervisor = updateResult.rows[0];

    return NextResponse.json(
      { 
        success: true, 
        supervisor: updatedSupervisor,
        message: "Profile updated successfully"
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
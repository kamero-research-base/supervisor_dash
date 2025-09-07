import { NextRequest, NextResponse } from "next/server";
import client from "../../utils/db";
import jwt from 'jsonwebtoken';

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
  created_at: string;
  updated_at: string;
  last_login?: string;
}

// GET current user profile based on authorization header or cookie
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Try to get authorization header first
    const authHeader = req.headers.get('authorization');
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Try to get token from cookies
      const cookies = req.cookies;
      token = cookies.get('session_token')?.value;
    }

    if (!token) {
      return NextResponse.json(
        { success: false, message: "No authentication token provided" },
        { status: 401 }
      );
    }

    // Verify and decode the token (you'll need to set up JWT_SECRET in your env)
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    let decoded: any;
    
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const supervisorId = decoded.userId || decoded.id;
    
    if (!supervisorId) {
      return NextResponse.json(
        { success: false, message: "Invalid token structure" },
        { status: 401 }
      );
    }

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
      WHERE s.id = $1 AND s.status = 'Active'
    `;

    const result = await client.query(sql, [supervisorId]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "User not found or inactive" },
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
      bio: supervisor.biography,
      created_at: supervisor.created_at,
      updated_at: supervisor.updated_at,
      last_login: supervisor.last_login,
    };

    // Update last_login timestamp
    await client.query(
      'UPDATE supervisors SET last_login = NOW() WHERE id = $1',
      [supervisorId]
    );

    return NextResponse.json(
      { 
        success: true, 
        supervisor: supervisorProfile,
        message: "Profile retrieved successfully"
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Current user fetch error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Server error: " + (error instanceof Error ? error.message : "Unknown error occurred.") 
      },
      { status: 500 }
    );
  }
}
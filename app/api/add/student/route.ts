// app/api/students/add/route.ts

import { NextRequest, NextResponse } from "next/server";
import client from "../../utils/db"; // Adjust the import path based on your project structure

// Define types for the student request
type StudentRequest = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  uniqueid: string;
  department: string;
  institute: string;
};

// Helper function to hash the student ID
async function hashId(id: number): Promise<string> {
  const textEncoder = new TextEncoder();
  const encoded = textEncoder.encode(id.toString());
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Handle POST request for adding a student
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData();
    const studentData: StudentRequest = {
      first_name: formData.get("first_name")?.toString() || "",
      last_name: formData.get("last_name")?.toString() || "",
      email: formData.get("email")?.toString() || "",
      phone: formData.get("phone")?.toString() || "",
      uniqueid: formData.get("uniqueid")?.toString() || "",
      department: formData.get("department")?.toString() || "",
      institute: formData.get("institute")?.toString() || "",
    };

    // Validate required fields
    if (
      !studentData.first_name ||
      !studentData.last_name ||
      !studentData.email ||
      !studentData.uniqueid ||
      !studentData.department ||
      !studentData.phone
    ) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const emailCheck = await client.query(
      `SELECT id FROM students WHERE email = $1`,
      [studentData.email]
    );

    if (emailCheck.rows.length > 0) {
      return NextResponse.json(
        { message: "A student with this email already exists" },
        { status: 400 }
      );
    }

    // Check if unique_id already exists
    const uniqueIdCheck = await client.query(
      `SELECT id FROM students WHERE unique_id = $1`,
      [studentData.uniqueid]
    );

    if (uniqueIdCheck.rows.length > 0) {
      return NextResponse.json(
        { message: "A student with this unique ID already exists" },
        { status: 400 }
      );
    }

    const status = "Pending";
    const defaultProfilePic = "/default-avatar.png"; 

    // Insert student into the database
    const result = await client.query(
      `INSERT INTO students (
        first_name, last_name, email, status, phone, 
        department, unique_id, institute, profile_picture, password, 
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()) 
      RETURNING id, email, first_name, last_name`,
      [
        studentData.first_name,
        studentData.last_name,
        studentData.email,
        status,
        studentData.phone,
        studentData.department,
        studentData.uniqueid,
        studentData.institute || "",
        defaultProfilePic,
        "", // Empty password
      ]
    );

    const studentId = result.rows[0].id;
    const hashedStudentId = await hashId(studentId);

    // Update the student with the hashed ID
    await client.query(
      `UPDATE students SET hashed_id = $1 WHERE id = $2`,
      [hashedStudentId, studentId]
    );

    return NextResponse.json(
      { 
        message: "Student added successfully", 
        student: { 
          id: studentId, 
          hashed_id: hashedStudentId, 
          email: studentData.email,
          name: `${result.rows[0].first_name} ${result.rows[0].last_name}`
        } 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error during student addition:", error);
    return NextResponse.json(
      { 
        message: "Student addition failed", 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      },
      { status: 500 }
    );
  }
}
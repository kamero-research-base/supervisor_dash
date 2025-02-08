import { NextRequest, NextResponse } from "next/server";

import client from "../../utils/db";

// Define types for the student request
type StudentRequest = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  uniqueid: string;
  department: string;
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
    };


    if (
      !studentData.first_name ||
      !studentData.last_name ||
      !studentData.email ||
      !studentData.uniqueid ||
      !studentData.department ||
      !studentData.phone
    ) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const status = "Pending";


    const result = await client.query(
      `INSERT INTO students (first_name, last_name, email, status, phone, department, unique_id, profile_picture, password, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) RETURNING id`,
      [
        studentData.first_name,
        studentData.last_name,
        studentData.email,
        status,
        studentData.phone,
        studentData.department,
        studentData.uniqueid,
        "",
        ""
      ]
    );

    const studentId = result.rows[0].id;
    const hashedStudentId = await hashId(studentId);

    await client.query(`UPDATE students SET hashed_id = $1 WHERE id = $2`, [
      hashedStudentId,
      studentId,
    ]);

    return NextResponse.json(
      { message: "Student added successfully", student: { id: studentId, hashed_id: hashedStudentId, email: studentData.email } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error during student addition:", error);
    return NextResponse.json(
      { message: "Student addition failed", error: (error as Error).message },
      { status: 500 }
    );
  }
}

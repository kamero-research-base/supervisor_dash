import { NextRequest, NextResponse } from "next/server";
import client from "../../utils/db";

// Define types for the department request
type DepartmentRequest = {
  name: string;
  label: string;
  school: string;
};

// Helper function to hash the department ID
async function hashId(id: number): Promise<string> {
  const textEncoder = new TextEncoder();
  const encoded = textEncoder.encode(id.toString());
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

// Handle POST request for adding a department
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData();
    const departmentData: DepartmentRequest = {
      name: formData.get('name')?.toString() || '',
      label: formData.get('label')?.toString() || '',
      school: formData.get('school')?.toString() || '',
    };

    console.log("Received data: ", departmentData);

    // Validate required fields
    if (!departmentData.name || !departmentData.label || !departmentData.school) {
      return NextResponse.json(
        { error: "All fields are required" }, 
        { status: 400 }
      );
    }

    const status = "Active";

    // Insert department into the database (temporarily without hashed_id)
    const result = await client.query(
      `INSERT INTO departments (name, label, school, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *`,
      [departmentData.name, departmentData.label, departmentData.school, status]
    );
    
    const departmentId = result.rows[0].id;

    // Generate the hashed ID
    const hashedDepartmentId = await hashId(departmentId);

    // Update the department with the hashed ID
    await client.query(
      `UPDATE departments SET hashed_id = $1 WHERE id = $2`,
      [hashedDepartmentId, departmentId]
    );

    // Get the updated department
    const updatedResult = await client.query(
      `SELECT * FROM departments WHERE id = $1`,
      [departmentId]
    );

    return NextResponse.json(
      { 
        message: "Department added successfully", 
        department: updatedResult.rows[0] 
      }, 
      { status: 201 }
    );
  } catch (error) {
    console.error("Error during department addition:", error);
    return NextResponse.json(
      { 
        message: "Department addition failed", 
        error: error instanceof Error ? error.message : "Unknown error occurred"
      }, 
      { status: 500 }
    );
  }
}
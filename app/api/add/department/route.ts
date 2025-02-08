import { NextRequest, NextResponse } from "next/server";
import client from "../../utils/db";

// Define types for the department request
type departmentRequest = {
  name: string;
  label: string;
  school:string;
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
  const formData = await req.formData();
  const departmentData: departmentRequest = {
    name: formData.get('name')?.toString() || '',
    label: formData.get('label')?.toString() || '',
    school: formData.get('school')?.toString() || '',
  };

  console.log("Received data: ", departmentData); // Log the department data for debugging

  // Validate required fields
  if (!departmentData.name || !departmentData.label || !departmentData.school) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  try {
    const status = "Active";

    // Insert department into the database
    const result = await client.query(
      `INSERT INTO departments (name, label, school, status, hashed_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *`,
      [departmentData.name, departmentData.label, departmentData.school, status, hashId]
    );
    const departmentId = result.rows[0].id;

    // Hash the department ID
    const hasheddepartmentId = await hashId(departmentId);

    // Update the department with the hashed ID (for additional usage in the response)
    await client.query(
      `UPDATE departments SET hashed_id = $1 WHERE id = $2`,
      [hasheddepartmentId, departmentId]
    );
  
    return NextResponse.json({ message: "department added successfully", department: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Error during department addition:", error); // Log only the message
    return NextResponse.json(
        { message: "department addition failed", error: error }, 
        { status: 500 }
    );
}

}

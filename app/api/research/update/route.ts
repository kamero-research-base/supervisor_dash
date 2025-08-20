import { NextRequest, NextResponse } from "next/server";
import client from "../../utils/db";

// Define types for the Research update request
type ResearchUpdateRequest = {
  id: number;
  title: string;
  researcher: string;
  year: string;
  status: string;
  progress_status: string;
  department?: string;
  student_id?: string;
  abstract?: string;
  keywords?: string;
  supervisor_id: number;
  updated_at: string;
};

// Handle PUT request for updating research
export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const researchData: ResearchUpdateRequest = await req.json();
    
    // Validate required fields
    if (!researchData.id || !researchData.title || !researchData.researcher || 
        !researchData.year || !researchData.progress_status) {
      return NextResponse.json(
        { message: "Required fields: id, title, researcher, year, progress_status" }, 
        { status: 400 }
      );
    }

    // Check if research exists and belongs to the supervisor
    const existingResearch = await client.query(
      `SELECT * FROM researches WHERE id = $1 `,
      [researchData.id]
    );

    if (existingResearch.rows.length === 0) {
      return NextResponse.json(
        { message: "Research not found or access denied" }, 
        { status: 404 }
      );
    }

    // Validate year format
    if (!/^\d{4}$/.test(researchData.year)) {
      return NextResponse.json(
        { message: "Year must be a 4-digit number" }, 
        { status: 400 }
      );
    }

    // Prepare update query - only update provided fields
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    // Always update these core fields
    updateFields.push(`title = $${paramIndex++}`);
    updateValues.push(researchData.title);
    
    updateFields.push(`researcher = $${paramIndex++}`);
    updateValues.push(researchData.researcher);
    
    updateFields.push(`year = $${paramIndex++}`);
    updateValues.push(researchData.year);
    
    updateFields.push(`progress_status = $${paramIndex++}`);
    updateValues.push(researchData.progress_status);
    
    updateFields.push(`updated_at = $${paramIndex++}`);
    updateValues.push(new Date().toISOString());

    // Optional fields - only update if provided
    if (researchData.status) {
      updateFields.push(`status = $${paramIndex++}`);
      updateValues.push(researchData.status);
    }

    if (researchData.department) {
      updateFields.push(`department = $${paramIndex++}`);
      updateValues.push(researchData.department);
    }

    if (researchData.student_id) {
      updateFields.push(`student_id = $${paramIndex++}`);
      updateValues.push(researchData.student_id);
    }

    if (researchData.abstract) {
      updateFields.push(`abstract = $${paramIndex++}`);
      updateValues.push(researchData.abstract);
    }

    if (researchData.keywords) {
      updateFields.push(`keywords = $${paramIndex++}`);
      updateValues.push(researchData.keywords);
    }

    // Add the research ID as the last parameter for WHERE clause
    updateValues.push(researchData.id);
    updateValues.push(researchData.supervisor_id);

    const updateQuery = `
      UPDATE researches 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
      RETURNING *
    `;

    const result = await client.query(updateQuery, updateValues);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: "Failed to update research" }, 
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: "Research updated successfully", 
        data: result.rows[0] 
      }, 
      { status: 200 }
    );

  } catch (error) {
    console.error("Error during research update:", error);
    return NextResponse.json(
      { 
        message: error instanceof Error ? "Research update failed: " + error.message : "Unknown error occurred"
      },
      { status: 500 }
    );
  }
}

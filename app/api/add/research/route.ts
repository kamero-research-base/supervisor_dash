import { NextRequest, NextResponse } from "next/server";
import client from "../../utils/db";
import uploadDocumentToSupabase from "../../utils/supabase";

// Define types for the Institution request
type InstitutionRequest = {
  title: string;
  researcher: string;
  category: string;
  status: string;
  year: string;
  abstract: string;
  institution: string;
  department: string;
  school: string;
  document: File;
  is_public: boolean; // NEW: Add visibility field
};

// Helper function to hash the Institution ID
async function hashId(id: number): Promise<string> {
  const textEncoder = new TextEncoder();
  const encoded = textEncoder.encode(id.toString());
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

// Handle POST request for adding a Research at Institution level
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData();
    
    // MODIFIED: Extract data from FormData including the new field
    const researchData: InstitutionRequest = {
      title: formData.get('title')?.toString() || '',
      researcher: formData.get('researcher')?.toString() || '',
      category: formData.get('category')?.toString() || '',
      status: formData.get('status')?.toString() || '',
      year: formData.get('year')?.toString() || '',
      abstract: formData.get('abstract')?.toString() || '',
      institution: formData.get('institution')?.toString() || '',
      department: formData.get('department')?.toString() || '',
      school: formData.get('school')?.toString() || '',
      document: formData.get('document') as File,
      is_public: formData.get('is_public')?.toString() === 'true', // NEW: Parse boolean from form data
    };

    // Validate required fields
    if (!researchData.title || !researchData.category || !researchData.researcher || 
        !researchData.status || !researchData.year || !researchData.institution || 
        !researchData.department || !researchData.school || 
        !researchData.document || !researchData.abstract) {
      return NextResponse.json(
        { error: "All fields are required" }, 
        { status: 400 }
      );
    }

    // Get institution, school, and department information
    const institutionInfoResult = await client.query(
      `SELECT 
        i.name as institution,
        s.name as school,
        d.name as department
      FROM institutions i
      JOIN colleges c ON c.institution::integer = i.id
      JOIN schools s ON s.college::integer = c.id
      JOIN departments d ON d.school::integer = s.id
      WHERE i.id = $1::integer 
        AND s.id = $2::integer 
        AND d.id = $3::integer`,
      [
        parseInt(researchData.institution),
        parseInt(researchData.school),
        parseInt(researchData.department)
      ]
    );

    if (institutionInfoResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Institution, school, or department information not found" }, 
        { status: 404 }
      );
    }

    const institutionInfo = institutionInfoResult.rows[0];

    const documentUrl = await uploadDocumentToSupabase(researchData.document, researchData.title);
    const doc_type = researchData.document.type;
    const approval_status = "Pending";
    const progress_status = researchData.status;
    const upload_level = "institution";

    // MODIFIED: Added 'is_public' to the INSERT query
    const result = await client.query(
      `INSERT INTO researches (
        title, researcher, category, status, progress_status, 
        document, year, abstract, document_type, department,
        school, institution, user_id, upload_level, is_public, -- NEW
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW()) -- MODIFIED
      RETURNING *`,
      [
        researchData.title, 
        researchData.researcher, 
        researchData.category, 
        approval_status, 
        progress_status, 
        documentUrl, 
        researchData.year, 
        researchData.abstract, 
        doc_type, 
        researchData.department,
        researchData.school,
        researchData.institution,
        researchData.institution, // Assuming user_id is the institution id here based on original code
        upload_level,
        researchData.is_public // NEW: Pass the value to the query
      ]
    );
    
    const researchId = result.rows[0].id;

    const hashedResearchId = await hashId(researchId);

    await client.query(
      `UPDATE researches SET hashed_id = $1 WHERE id = $2`,
      [hashedResearchId, researchId]
    );

    const updatedResult = await client.query(
      `SELECT * FROM researches WHERE id = $1`,
      [researchId]
    );
  
    return NextResponse.json(
      { 
        message: "Research added successfully", 
        research: updatedResult.rows[0] 
      }, 
      { status: 201 }
    );
  } catch (error) {
    console.error("Error during Research addition:", error);
    return NextResponse.json(
      { 
        message: "Research addition failed",
        error: error instanceof Error ? error.message : "Unknown error occurred"
      },
      { status: 500 }
    );
  }
}
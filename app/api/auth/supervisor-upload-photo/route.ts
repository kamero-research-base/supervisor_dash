//app/api/auth/supervisor-upload-photo/route.ts
import { NextRequest, NextResponse } from "next/server";
import client from "../../utils/db";
import uploadDocumentToSupabase from "../../utils/supabase";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData();
    const photo = formData.get('photo') as File;
    const supervisorIdString = formData.get('supervisorId') as string;

    // Validation
    const supervisorId = parseInt(supervisorIdString, 10);
    if (isNaN(supervisorId)) {
      return NextResponse.json(
        { success: false, message: "Invalid Supervisor ID in form data. Must be a number." },
        { status: 400 }
      );
    }

    // Check if supervisor exists
    const supervisorCheckSql = "SELECT id, email, first_name, last_name, phone FROM supervisors WHERE id = $1";
    const supervisorResult = await client.query(supervisorCheckSql, [supervisorId]);

    if (supervisorResult.rowCount === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Supervisor not found" 
        },
        { status: 404 }
      );
    }

    const supervisor = supervisorResult.rows[0];

    // Check if supervisor has a phone number
    if (!supervisor.phone) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Supervisor phone number is required for profile picture upload" 
        },
        { status: 400 }
      );
    }

    // Validate file type - Only JPG and PNG allowed
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(photo.type)) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Invalid file type. Only JPEG, PNG, and JPG are allowed." 
        },
        { status: 400 }
      );
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (photo.size > maxSize) {
      return NextResponse.json(
        { 
          success: false, 
          message: "File size too large. Maximum size is 5MB." 
        },
        { status: 400 }
      );
    }

    // Create filename using unified naming convention: phone-number_timeStamp.(JPG/PNG)
    const timestamp = Date.now();
    const fileExtension = photo.type === 'image/jpeg' ? 'JPG' : 'PNG';
    const fileName = `${supervisor.phone}_${timestamp}.${fileExtension}`;
    try {
      // Upload to Supabase with unified 'profile_pictures' folder
      const photoUrl = await uploadDocumentToSupabase(photo, fileName);

      // Update database with new profile picture URL
      const updateSql = `
        UPDATE supervisors 
        SET profile_picture = $1, updated_at = NOW() 
        WHERE id = $2 
        RETURNING id, profile_picture
      `;
      
      const updateResult = await client.query(updateSql, [photoUrl, supervisorId]);

      if (updateResult.rowCount === 0) {
        return NextResponse.json(
          { 
            success: false, 
            message: "Failed to update supervisor profile picture in database" 
          },
          { status: 500 }
        );
      }

      // Log the successful upload
      const logContent = `Profile picture updated for supervisor ${supervisor.email} - ${supervisor.first_name} ${supervisor.last_name}`;
      const logSql = `
        INSERT INTO logs (user_id, session_id, content, created_at, expires_at) 
        VALUES ($1, $2, $3, $4, $5)
      `;
      
      const created_at = new Date();
      const expires_at = new Date(created_at.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days
      
      try {
        await client.query(logSql, [
          supervisor.id, 
          supervisor.hashed_id || `supervisor-session-${supervisor.id}`, 
          logContent, 
          created_at, 
          expires_at
        ]);
      } catch (logError) {
        console.warn("Failed to log supervisor profile picture update:", logError);
        // Don't fail the request if logging fails
      }

      return NextResponse.json(
        {
          success: true,
          photo_url: photoUrl,
          message: "Supervisor profile picture uploaded successfully"
        },
        { status: 200 }
      );

    } catch (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { 
          success: false, 
          message: "Failed to upload photo: " + (uploadError instanceof Error ? uploadError.message : "Unknown upload error")
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Supervisor photo upload endpoint error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Server error: " + (error instanceof Error ? error.message : "Unknown error occurred.")
      },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch current supervisor profile picture
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const supervisorId = searchParams.get('supervisorId');

    if (!supervisorId) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Supervisor ID is required" 
        },
        { status: 400 }
      );
    }

    const sql = "SELECT id, profile_picture, first_name, last_name FROM supervisors WHERE id = $1";
    const result = await client.query(sql, [supervisorId]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Supervisor not found" 
        },
        { status: 404 }
      );
    }

    const supervisor = result.rows[0];

    return NextResponse.json(
      {
        success: true,
        photo_url: supervisor.profile_picture || "",
        supervisor_name: `${supervisor.first_name} ${supervisor.last_name}`
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Get supervisor profile picture error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Server error: " + (error instanceof Error ? error.message : "Unknown error occurred.")
      },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import client from "../../utils/db";
import uploadDocumentToSupabase from "../../utils/supabase";

// POST - Upload profile photo
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData();
    const photo = formData.get('photo') as File;
    const userIdString = formData.get('userId') as string;

    // Validation
    const userId = parseInt(userIdString, 10);
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, message: "Invalid User ID in form data. Must be a number." },
        { status: 400 }
      );
    }

    // Check if supervisor exists
    const userCheckSql = "SELECT id, email, first_name, last_name, phone FROM supervisors WHERE id = $1";
    const userResult = await client.query(userCheckSql, [userId]);

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Supervisor not found" 
        },
        { status: 404 }
      );
    }

    const supervisor = userResult.rows[0];

    // Validate inputs
    if (!photo) {
      return NextResponse.json(
        { success: false, message: "No photo file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(photo.type)) {
      return NextResponse.json(
        { success: false, message: "Invalid file type. Only JPEG, PNG, and WebP are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (photo.size > maxSize) {
      return NextResponse.json(
        { success: false, message: "File size too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Create filename using ID and timestamp format (similar to student_dash)
    const timestamp = Date.now();
    const fileExtension = photo.type === 'image/jpeg' || photo.type === 'image/jpg' ? 'jpg' : 
                         photo.type === 'image/png' ? 'png' : 'webp';
    const fileName = `supervisor-${supervisor.id}_${timestamp}.${fileExtension}`;

    try {
      // Upload to Supabase (like student_dash)
      const photoUrl = await uploadDocumentToSupabase(photo, fileName, 'profile_pictures');

      // Update supervisor profile picture in database
      const updateSql = `
        UPDATE supervisors 
        SET profile_picture = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, first_name, last_name, profile_picture
      `;

      const result = await client.query(updateSql, [photoUrl, userId]);

      if (result.rows.length === 0) {
        return NextResponse.json(
          { success: false, message: "Supervisor not found" },
          { status: 404 }
        );
      }

      const updatedSupervisor = result.rows[0];

      // Log the successful upload (similar to student_dash)
      const logContent = `Profile picture updated for ${supervisor.email} - ${supervisor.first_name} ${supervisor.last_name}`;
      try {
        // Simple logging without complex session tracking
        console.log("Profile picture upload:", logContent);
      } catch (logError) {
        console.warn("Failed to log profile picture update:", logError);
      }

      return NextResponse.json(
        { 
          success: true, 
          photo_url: photoUrl,
          message: "Profile picture uploaded successfully"
        },
        { status: 200 }
      );

    } catch (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json(
        { success: false, message: "Failed to upload photo: " + (uploadError instanceof Error ? uploadError.message : "Unknown upload error") },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Photo upload error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Server error: " + (error instanceof Error ? error.message : "Unknown error occurred.") 
      },
      { status: 500 }
    );
  }
}
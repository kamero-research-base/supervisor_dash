import { NextRequest, NextResponse } from "next/server";
import client from "../../utils/db";
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST - Upload profile photo
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData();
    const photo = formData.get('photo') as File;
    const userId = formData.get('userId') as string;

    // Validate inputs
    if (!photo) {
      return NextResponse.json(
        { success: false, message: "No photo file provided" },
        { status: 400 }
      );
    }

    if (!userId || isNaN(Number(userId))) {
      return NextResponse.json(
        { success: false, message: "Invalid user ID" },
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

    // Convert file to buffer
    const bytes = await photo.arrayBuffer();
    const buffer = Buffer.from(bytes);

    try {
      // Upload to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: 'supervisor-profiles',
            public_id: `supervisor-${userId}-${Date.now()}`,
            transformation: [
              { width: 400, height: 400, crop: 'fill', gravity: 'face' },
              { quality: 'auto', fetch_format: 'auto' }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });

      const cloudinaryResult = uploadResult as any;
      const photoUrl = cloudinaryResult.secure_url;

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

      return NextResponse.json(
        { 
          success: true, 
          photo_url: photoUrl,
          supervisor: updatedSupervisor,
          message: "Profile photo updated successfully"
        },
        { status: 200 }
      );

    } catch (cloudinaryError) {
      console.error("Cloudinary upload error:", cloudinaryError);
      return NextResponse.json(
        { success: false, message: "Failed to upload image. Please try again." },
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
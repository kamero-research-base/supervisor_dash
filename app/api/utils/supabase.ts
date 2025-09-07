import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function uploadDocumentToSupabase(file: File, fileName: string, folder: string = 'materials'): Promise<string> {
  try {
    let fullPath: string;
    
    // Special handling for profile pictures to ensure exact path format
    if (folder === 'profile_pictures') {
      // For profile pictures, use the fileName as-is (already formatted as supervisor-id_timestamp.ext)
      fullPath = `profile_pictures/${fileName}`;
    } else {
      // For other files, use the original logic
      const safeFileName = fileName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase();
      const timestamp = Date.now();
      const uniqueFileName = `${timestamp}-${safeFileName}`;
      fullPath = `${folder}/${uniqueFileName}`;
    }

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from("research-documents") 
      .upload(fullPath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Upload error: ${error.message}`);
    }

    // Get the public URL of the uploaded document
    const { data: publicUrl } = supabase.storage
      .from("research-documents")
      .getPublicUrl(fullPath);

    if (!publicUrl || !publicUrl.publicUrl) {
      throw new Error('Failed to generate public URL');
    }
    return publicUrl.publicUrl;
  } catch (error: any) {
    console.error('Upload failed:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }
}

// Upload specifically for profile pictures
export async function uploadProfilePictureToSupabase(file: File, supervisorId: string): Promise<string> {
  try {
    const timestamp = Date.now();
    const fileExtension = file.type === 'image/jpeg' || file.type === 'image/jpg' ? 'jpg' : 
                         file.type === 'image/png' ? 'png' : 'webp';
    const fileName = `supervisor-${supervisorId}_${timestamp}.${fileExtension}`;
    
    return await uploadDocumentToSupabase(file, fileName, 'profile_pictures');
  } catch (error: any) {
    throw new Error(`Profile picture upload failed: ${error.message}`);
  }
}

export async function deleteDocumentFromSupabase(filePath: string): Promise<void> {
  try {
    const { data, error } = await supabase.storage
      .from("research-documents") // Replace with your Supabase bucket name // Replace with your Supabase bucket name
      .remove([filePath]); // File path inside the bucket

    if (error) {
      throw new Error(error.message);
    }

    console.log("File deleted successfully:", filePath);
  } catch (error: any) {
    console.error("Error deleting file:", error.message);
  }
}

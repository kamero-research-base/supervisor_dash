import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function uploadDocumentToSupabase(file: File, title: string): Promise<string> {
  try {
    const fileName = title.replace(/\s+/g, "_").toLowerCase(); // Format title for filename

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from("research-documents") // Replace with your Supabase bucket name 
      .upload(`materials/${fileName}`, file, {
        cacheControl: "3600",
        upsert: false, // Prevent overwriting existing files
      });

    if (error) {
      throw new Error(error.message);
    }

    // Get the public URL of the uploaded document
    const { data: publicUrl } = supabase.storage
      .from("research-documents") // Replace with your Supabase bucket name
      .getPublicUrl(`materials/${fileName}`);

    return publicUrl.publicUrl; // Return the file's direct URL
  } catch (error: any) {
    throw new Error(`Upload failed: ${error.message}`);
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

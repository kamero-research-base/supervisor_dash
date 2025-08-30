//app/api/auth/supervisor-verify-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import client from "../../utils/db";

// Define types for the verify request
type VerifyRequest = {
  code: string;
  hashed_id: string;
};

// Handle POST request for verification
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData();
    const verifyData: VerifyRequest = {
      code: formData.get("code")?.toString() || "",
      hashed_id: formData.get("hashed_id")?.toString() || "",
    };

    // Validate required fields
    if (!verifyData.code || !verifyData.hashed_id) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    // Check if the code exists in the database
    const checkQuery = `SELECT * FROM supervisors WHERE hashed_id = $1 AND verification_code = $2`;
    const checkResult = await client.query(checkQuery, [verifyData.hashed_id, verifyData.code]);

    if (checkResult.rowCount === 0) {
      return NextResponse.json({ message: "Invalid verification code" }, { status: 401 });
    }

    const supervisor = checkResult.rows[0];

    // Add 10 minutes to the updated_at timestamp for expiration check
    const expirationTime = new Date(supervisor.updated_at);
    expirationTime.setMinutes(expirationTime.getMinutes() + 10);

    // Optional: Check if verification code has expired
    /*if (expirationTime <= new Date()) {
      return NextResponse.json({ message: "Verification code expired" }, { status: 406 });
    }*/

    // Update supervisor status to Active and clear verification code
    const updateQuery = `UPDATE supervisors SET status ='Active', verification_code='NULL' WHERE hashed_id = $1`;
    await client.query(updateQuery, [verifyData.hashed_id]);

    // Log the successful verification
    const logContent = `Email verified successfully for supervisor ${supervisor.email} - ${supervisor.first_name} ${supervisor.last_name}`;
    const logSql = `
        INSERT INTO logs (user_id, session_id, content, created_at, expires_at) 
        VALUES ($1, $2, $3, $4, $5)
    `;
    
    const created_at = new Date();
    const expires_at = new Date(created_at.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days
    
    try {
        await client.query(logSql, [
            supervisor.id, 
            supervisor.hashed_id, 
            logContent, 
            created_at, 
            expires_at
        ]);
    } catch (logError) {
        console.warn("Failed to log supervisor email verification:", logError);
        // Don't fail the request if logging fails
    }
  
    return NextResponse.json({ message: "Verified successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error during supervisor verification:", error);
    return NextResponse.json({ message: "Verification failed", error: (error as Error).message }, { status: 500 });
  }
}
//app/api/auth/supervisor-resend-code/route.ts
import { NextRequest, NextResponse } from "next/server";
import client from "../../utils/db";
import { sendVerificationEmail } from "../../utils/config";

// Define types for the resend request
type ResendRequest = {
  hashed_id: string;
};

// Handle POST request for resending verification code
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.json();
    const { hashed_id } = formData;

    // Validate required fields
    if (!hashed_id) {
      return NextResponse.json({ message: "Failed, try again!" }, { status: 400 });
    }

    // Check if the supervisor exists and get their information
    const checkQuery = `SELECT verification_code, email, first_name FROM supervisors WHERE hashed_id = $1`;
    const checkResult = await client.query(checkQuery, [hashed_id]);

    if (checkResult.rowCount === 0) {
      return NextResponse.json({ message: "Error occurred" }, { status: 400 });
    }

    const supervisor = checkResult.rows[0];
    const email: string = supervisor.email;
    const code: string = supervisor.verification_code;
    const name: string = supervisor.first_name;

    // Validate that supervisor has a verification code to resend
    if (!code) {
      return NextResponse.json({ message: "No verification code found to resend" }, { status: 400 });
    }

    // Send verification email
    try {
      await sendVerificationEmail(email, code, name);
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      return NextResponse.json({ message: "Failed to send verification email. Please try again." }, { status: 500 });
    }

    // Log the resend action
    const logContent = `Verification code resent to supervisor ${email} - ${name}`;
    const logSql = `
        INSERT INTO logs (user_id, session_id, content, created_at, expires_at) 
        VALUES ($1, $2, $3, $4, $5)
    `;
    
    const created_at = new Date();
    const expires_at = new Date(created_at.getTime() + (24 * 60 * 60 * 1000)); // 24 hours
    
    try {
        // We need to get the supervisor ID for logging
        const supervisorQuery = `SELECT id FROM supervisors WHERE hashed_id = $1`;
        const supervisorResult = await client.query(supervisorQuery, [hashed_id]);
        
        if (supervisorResult.rowCount > 0) {
            await client.query(logSql, [
                supervisorResult.rows[0].id, 
                hashed_id, 
                logContent, 
                created_at, 
                expires_at
            ]);
        }
    } catch (logError) {
        console.warn("Failed to log supervisor code resend:", logError);
        // Don't fail the request if logging fails
    }

    return NextResponse.json({ message: "Verification code resent successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error during supervisor code resend:", error);
    return NextResponse.json({ message: "Resend failed", error: (error as Error).message }, { status: 500 });
  }
}
//app/api/auth/supervisor-send-profile-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import client from "../../utils/db";
import { sendVerificationEmail } from "../../utils/config";

// Helper function to generate OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { supervisorId, newEmail, supervisorName } = await req.json();

    // Input validation
    if (!supervisorId || !newEmail || !supervisorName) {
      return NextResponse.json({
        success: false,
        message: "Supervisor ID, new email, and supervisor name are required"
      }, { status: 400 });
    }

    // Convert supervisorId to integer
    const supervisorIdInt = parseInt(supervisorId, 10);
    if (isNaN(supervisorIdInt)) {
      return NextResponse.json({
        success: false,
        message: "Invalid supervisor ID format"
      }, { status: 400 });
    }

    // Check if supervisor exists and is active
    const supervisorCheckSql = "SELECT id, status FROM supervisors WHERE id = $1";
    const supervisorResult = await client.query(supervisorCheckSql, [supervisorIdInt]);

    if (supervisorResult.rowCount === 0) {
      return NextResponse.json({
        success: false,
        message: "Supervisor not found"
      }, { status: 404 });
    }

    const supervisor = supervisorResult.rows[0];
    if (supervisor.status?.toLowerCase() !== "active") {
      return NextResponse.json({
        success: false,
        message: "Supervisor account is not active"
      }, { status: 403 });
    }

    // Generate OTP
    const otpCode = generateOTP();

    // Store OTP temporarily in verification_code field
    const updateOtpSql = `
      UPDATE supervisors 
      SET verification_code = $1, updated_at = NOW() 
      WHERE id = $2
    `;
    await client.query(updateOtpSql, [otpCode, supervisorIdInt]);

    // Send OTP to the new email
    try {
      await sendVerificationEmail(newEmail, otpCode, supervisorName);
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      return NextResponse.json({
        success: false,
        message: "Failed to send OTP email. Please try again."
      }, { status: 500 });
    }

    // Log the OTP send action
    const logContent = `Profile update OTP sent to new email: ${newEmail} for supervisor ${supervisorName}`;
    const logSql = `
      INSERT INTO logs (user_id, session_id, content, created_at, expires_at) 
      VALUES ($1, $2, $3, $4, $5)
    `;
    
    const created_at = new Date();
    const expires_at = new Date(created_at.getTime() + (24 * 60 * 60 * 1000)); // 24 hours
    
    try {
      await client.query(logSql, [
        supervisorIdInt,
        `supervisor-profile-update-${supervisorIdInt}`,
        logContent,
        created_at,
        expires_at
      ]);
    } catch (logError) {
      console.warn("Failed to log supervisor OTP send:", logError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully to your new email address"
    }, { status: 200 });

  } catch (error) {
    console.error("Send supervisor profile OTP error:", error);
    return NextResponse.json({
      success: false,
      message: "Server error: " + (error instanceof Error ? error.message : "Unknown error occurred.")
    }, { status: 500 });
  }
}
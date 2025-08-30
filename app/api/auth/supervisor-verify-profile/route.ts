//app/api/auth/supervisor-verify-profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import client from "../../utils/db";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { supervisorId, otp, newEmail } = await req.json();

    // Input validation
    if (!supervisorId || !otp || !newEmail) {
      return NextResponse.json({
        success: false,
        message: "Supervisor ID, OTP, and new email are required"
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

    // Validate OTP format
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json({
        success: false,
        message: "Invalid OTP format. Must be 6 digits."
      }, { status: 400 });
    }

    // Check if supervisor exists and verify OTP
    const sql = `
      SELECT id, verification_code, first_name, last_name, email
      FROM supervisors 
      WHERE id = $1
    `;
    const result = await client.query(sql, [supervisorIdInt]);

    if (result.rowCount === 0) {
      return NextResponse.json({
        success: false,
        message: "Supervisor not found"
      }, { status: 404 });
    }

    const supervisor = result.rows[0];

    // Verify OTP
    if (supervisor.verification_code !== otp) {
      return NextResponse.json({
        success: false,
        message: "Invalid OTP code"
      }, { status: 400 });
    }

    // Clear the verification code after successful verification
    const clearOtpSql = `
      UPDATE supervisors 
      SET verification_code = NULL, updated_at = NOW() 
      WHERE id = $1
    `;
    await client.query(clearOtpSql, [supervisorIdInt]);

    // Log the successful verification
    const logContent = `Profile update OTP verified successfully for supervisor with new email: ${newEmail}`;
    const logSql = `
      INSERT INTO logs (user_id, session_id, content, created_at, expires_at) 
      VALUES ($1, $2, $3, $4, $5)
    `;
    
    const created_at = new Date();
    const expires_at = new Date(created_at.getTime() + (24 * 60 * 60 * 1000)); // 24 hours
    
    try {
      await client.query(logSql, [
        supervisorIdInt,
        `supervisor-profile-update-verified-${supervisorIdInt}`,
        logContent,
        created_at,
        expires_at
      ]);
    } catch (logError) {
      console.warn("Failed to log supervisor OTP verification:", logError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully",
      supervisor: {
        id: supervisor.id,
        name: `${supervisor.first_name} ${supervisor.last_name}`,
        email: supervisor.email
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Verify supervisor profile OTP error:", error);
    return NextResponse.json({
      success: false,
      message: "Server error: " + (error instanceof Error ? error.message : "Unknown error occurred.")
    }, { status: 500 });
  }
}
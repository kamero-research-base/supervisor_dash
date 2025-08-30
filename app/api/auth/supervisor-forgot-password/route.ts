//app/api/auth/supervisor-forgot-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import client from '../../utils/db';
import { sendChangePasswordVerificationEmail } from "../../utils/config";

// Function to generate a 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Forgot password handler
export async function POST(req: NextRequest): Promise<NextResponse> {
    let requestBody;
    
    // Safe JSON parsing
    try {
        requestBody = await req.json();
    } catch (error) {
        return NextResponse.json({ message: "Invalid JSON format in request." }, { status: 400 });
    }

    const { email } = requestBody;

    // Input validation
    if (!email) {
        return NextResponse.json({ message: "Enter your email." }, { status: 400 });
    }

    try {
        // Query supervisor by email
        const sql = "SELECT hashed_id, id, first_name, last_name FROM supervisors WHERE email = $1";
        const result = await client.query(sql, [email]);

        if (result.rowCount === 0) {
            return NextResponse.json({ message: "Email not found" }, { status: 404 });
        }

        const supervisor = result.rows[0];
        const verificationCode = generateVerificationCode();

        // Update supervisor with verification code
        await client.query(`UPDATE supervisors SET verification_code = $1, updated_at = NOW() WHERE hashed_id = $2`, [
            verificationCode,
            supervisor.hashed_id,
        ]);

        // Send password reset email
        try {
            await sendChangePasswordVerificationEmail(email, verificationCode);
        } catch (emailError) {
            console.error("Email sending error:", emailError);
            return NextResponse.json({ message: "Failed to send password reset email. Please try again." }, { status: 500 });
        }

        // Log the password reset request
        const logContent = `Password reset requested for supervisor ${email} - ${supervisor.first_name} ${supervisor.last_name}`;
        const logSql = `
            INSERT INTO logs (user_id, session_id, content, created_at, expires_at) 
            VALUES ($1, $2, $3, $4, $5)
        `;
        
        const created_at = new Date();
        const expires_at = new Date(created_at.getTime() + (24 * 60 * 60 * 1000)); // 24 hours
        
        try {
            await client.query(logSql, [
                supervisor.id, 
                supervisor.hashed_id, 
                logContent, 
                created_at, 
                expires_at
            ]);
        } catch (logError) {
            console.warn("Failed to log supervisor password reset request:", logError);
            // Don't fail the request if logging fails
        }

        // Send response with supervisor data
        return NextResponse.json({
            message: "Password reset email sent successfully!",
            supervisor: {
                hashed_id: supervisor.hashed_id,
                name: `${supervisor.first_name} ${supervisor.last_name}`
            }
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ message: "Server error: " + (error instanceof Error ? "Connection failed" : "Unknown error occurred.") }, { status: 500 });
    }
}
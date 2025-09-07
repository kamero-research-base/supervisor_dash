//app/api/auth/supervisor-change-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import client from '../../utils/db';
import { sendChangePasswordConfirmationEmail } from "../../utils/config";
import crypto from "crypto";

// Helper function to hash the password using SHA-256
async function hashPassword(password: string): Promise<string> {
  const textEncoder = new TextEncoder();
  const encoded = textEncoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

// Change password handler
export async function POST(req: NextRequest): Promise<NextResponse> {
    let requestBody;
    
    // Safe JSON parsing
    try {
        requestBody = await req.json();
    } catch (error) {
        return NextResponse.json({ message: "Invalid JSON format in request." }, { status: 400 });
    }

    const { hashed_id, password} = requestBody;

    // Input validation
    if (!hashed_id || !password) {
        return NextResponse.json({ message: "All fields required." }, { status: 400 });
    }

    try {
         const hashedPassword = await hashPassword(password);
        const results = await client.query(`UPDATE supervisors SET password = $1, status='Active' WHERE hashed_id = $2 RETURNING *`, [
         hashedPassword,
         hashed_id,
        ]);
        
        if (results.rowCount === 0) {
            return NextResponse.json({ message: "Supervisor not found or update failed." }, { status: 404 });
        }

        const supervisor = results.rows[0];

        await sendChangePasswordConfirmationEmail(supervisor.email);
        
        // Log the password change
        const logContent = `Password changed successfully for supervisor ${supervisor.email} - ${supervisor.first_name} ${supervisor.last_name}`;
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
            console.warn("Failed to log supervisor password change:", logError);
            // Don't fail the request if logging fails
        }

        // Send response with supervisor data
        return NextResponse.json({
            message: "Password changed successfully!",
            supervisor: {
                id: supervisor.id,
                name: `${supervisor.first_name} ${supervisor.last_name}`,
                email: supervisor.email
            }
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ message: "Server error: " + (error instanceof Error ? error.message : "Unknown error occurred.") }, { status: 500 });
    }
}
import { NextRequest, NextResponse } from "next/server";
import client from "../../utils/db";
import crypto from "crypto";
import { sendVerificationEmail } from "../../utils/config";

// Helper function to hash the password using SHA-256
async function hashPassword(password: string): Promise<string> {
    const textEncoder = new TextEncoder();
    const encoded = textEncoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Helper function to generate OTP
function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper function to add days to a date
function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

// Login handler
export async function POST(req: NextRequest): Promise<NextResponse> {
    let requestBody;

    // Safe JSON parsing
    try {
        requestBody = await req.json();
    } catch (error) {
        return NextResponse.json({ message: "Invalid JSON format in request." }, { status: 400 });
    }

    const { login, password } = requestBody;

    // Input validation
    if (!login || !password) {
        return NextResponse.json({ message: "Both fields are required." }, { status: 400 });
    }

    try {
        // Query user by email or phone
        const sql = `
            SELECT 
                id, first_name, last_name, password, hashed_id, department, email, profile_picture, status 
            FROM supervisors 
            WHERE email = $1 OR phone = $1
        `;
        const result = await client.query(sql, [login]);
        const user = result.rows[0];

        // Check if user exists
        if (result.rowCount === 0) {
            return NextResponse.json({ message: "Invalid login credentials." }, { status: 400 });
        }

        // Verify password
        if ((await hashPassword(password)) !== user.password) {
            return NextResponse.json({ message: "Invalid login credentials." }, { status: 400 });
        }

        // Handle unverified/pending accounts
        if (user.status === "Pending" || user.status === "Unverified") {
            return NextResponse.json({ message: "Your account is not verified. Please verify your account." }, { status: 403 });
        }

        // Handle locked accounts
        if (user.status === "Locked") {
            return NextResponse.json({ message: "Your account is locked. Please contact your administrator." }, { status: 403 });
        }

        // Handle inactive accounts
        if (user.status !== "Active") {
            return NextResponse.json({ message: "Unauthorized access. Only active supervisors can log in." }, { status: 403 });
        }

        // Generate OTP
        const otpCode = generateOTP();     
        
        // Save OTP to database
        const updateOtpSql = `
            UPDATE supervisors 
            SET verification_code = $1, 
                updated_at = NOW()
            WHERE id = $2
        `;
        await client.query(updateOtpSql, [otpCode, user.id]);

        // Send OTP via email
        try {
            await sendVerificationEmail(user.email, otpCode, user.first_name);
        } catch (emailError) {
            console.error("Email sending error:", emailError);
            return NextResponse.json({ 
                message: "Login successful but failed to send OTP email. Please try again." 
            }, { status: 500 });
        }

        // Insert login record
        const content = `New login from ${user.email}, ${user.first_name} - OTP sent`;
        const created_at = new Date();
        const expires_at = addDays(created_at, 1);

        const insertSql = `
            INSERT INTO logs (user_id, session_id, content, created_at, expires_at) 
            VALUES ($1, $2, $3, $4, $5)
        `;
        await client.query(insertSql, [user.id, user.hashed_id, content, created_at, expires_at]);

        // Send response indicating OTP has been sent
        return NextResponse.json({
            message: "Login credentials verified. OTP has been sent to your email.",
            user: {
                id: user.id,
                name: `${user.first_name} ${user.last_name}`,
                session_id: user.hashed_id,
                profile: user.profile_picture,
                email: user.email,
                department_id: user.department || "",
            },
            requiresOTP: true
        }, { status: 200 });

    } catch (error) {
        console.error("Login Error:", error);
        return NextResponse.json({ 
            message: "Server error: " + (error instanceof Error ? error.message : "Unknown error occurred.") 
        }, { status: 500 });
    }
}
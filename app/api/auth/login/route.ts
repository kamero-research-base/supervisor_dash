import { NextRequest, NextResponse } from "next/server";
import client from "../../utils/db";
import crypto from "crypto";
import { sendVerificationEmail } from "../../utils/config";

// Helper function to hash the password using SHA-256 (keeping existing method)
async function hashPassword(password: string): Promise<string> {
    const textEncoder = new TextEncoder();
    const encoded = textEncoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Helper function to generate secure OTP
function generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
}

// Helper function to add days to a date
function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

// Input validation
function validateInput(login: string, password: string): { isValid: boolean; message?: string } {
    if (!login || typeof login !== 'string' || login.trim().length === 0) {
        return { isValid: false, message: "Email or phone is required." };
    }
    
    if (!password || typeof password !== 'string' || password.trim().length === 0) {
        return { isValid: false, message: "Password is required." };
    }

    // Basic email format validation if it contains @
    if (login.includes('@')) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(login.trim())) {
            return { isValid: false, message: "Invalid email format." };
        }
    }

    return { isValid: true };
}

// Standardized response helper
function createResponse(success: boolean, message: string, status: number, data?: any) {
    const response = {
        success,
        message,
        timestamp: new Date().toISOString(),
        ...(data && { ...data })
    };
    return NextResponse.json(response, { status });
}

// Login handler
export async function POST(req: NextRequest): Promise<NextResponse> {
    let requestBody;
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    try {
        // Safe JSON parsing
        try {
            requestBody = await req.json();
        } catch (error) {
            return createResponse(false, "Invalid JSON format in request body.", 400);
        }

        const { login, password } = requestBody;

        // Input validation
        const validation = validateInput(login, password);
        if (!validation.isValid) {
            return createResponse(false, validation.message!, 400);
        }

        const trimmedLogin = login.trim().toLowerCase();

        // Query user by email or phone with optimized query
        const sql = `
            SELECT 
                s.id, 
                s.first_name, 
                s.last_name, 
                s.password, 
                s.hashed_id, 
                s.email, 
                s.profile_picture, 
                s.status, 
                s.department, 
                s.school,
                sc.name AS school_name,
                c.id AS college_id,
                c.name AS college_name,
                i.id AS institution_id,
                i.name AS institution_name
            FROM supervisors s
            LEFT JOIN schools sc ON CAST(sc.id AS TEXT) = s.school
            LEFT JOIN colleges c ON CAST(c.id AS TEXT) = sc.college
            LEFT JOIN institutions i ON CAST(i.id AS TEXT) = c.institution
            WHERE LOWER(s.email) = $1 OR s.phone = $1
            LIMIT 1
        `;

        const result = await client.query(sql, [trimmedLogin]);
        const user = result.rows[0];

        // Check if user exists
        if (!user) {
            console.log(`Failed login attempt for: ${trimmedLogin} from IP: ${clientIP}`);
            return createResponse(false, "Invalid login credentials.", 401);
        }

        // Verify password
        const hashedInputPassword = await hashPassword(password.trim());
        if (hashedInputPassword !== user.password) {
            console.log(`Password verification failed for user: ${user.email} from IP: ${clientIP}`);
            return createResponse(false, "Invalid login credentials.", 401);
        }

        // Handle different account statuses with specific messages
        const statusHandlers = {
            "Pending": () => createResponse(false, "Your account is pending approval. Please wait for administrator confirmation.", 403),
            "Unverified": () => createResponse(false, "Your account is not verified. Please verify your email address first.", 403),
            "Locked": () => createResponse(false, "Your account has been locked. Please contact your administrator for assistance.", 403),
            "Suspended": () => createResponse(false, "Your account has been suspended. Please contact support for more information.", 403),
            "Inactive": () => createResponse(false, "Your account is inactive. Please contact your administrator.", 403)
        };

        if (user.status !== "Active") {
            const handler = statusHandlers[user.status as keyof typeof statusHandlers];
            if (handler) {
                console.log(`Login attempt for ${user.status} account: ${user.email}`);
                return handler();
            }
            return createResponse(false, "Account access denied. Please contact support.", 403);
        }

        // Generate secure OTP
        const otpCode = generateOTP();
        
        // Update user with OTP and timestamp
        const updateOtpSql = `
            UPDATE supervisors 
            SET verification_code = $1, 
                updated_at = NOW()
            WHERE id = $2
        `;
        await client.query(updateOtpSql, [otpCode, user.id]);

        // Send OTP via email with error handling
        try {
            await sendVerificationEmail(user.email, otpCode, user.first_name);
            console.log(`OTP sent successfully to: ${user.email}`);
        } catch (emailError) {
            console.error("Email sending failed:", {
                error: emailError,
                userId: user.id,
                email: user.email,
                timestamp: new Date().toISOString()
            });
            
            return createResponse(
                false, 
                "Verification code could not be sent. Please try again or contact support.", 
                500
            );
        }

        // Create detailed log entry
        const logContent = `Login successful for ${user.email} (${user.first_name} ${user.last_name}) - OTP sent to ${user.email} - IP: ${clientIP}`;
        const created_at = new Date();
        const expires_at = addDays(created_at, 1);

        const insertLogSql = `
            INSERT INTO logs (user_id, session_id, content, created_at, expires_at) 
            VALUES ($1, $2, $3, $4, $5)
        `;
        
        try {
            await client.query(insertLogSql, [user.id, user.hashed_id, logContent, created_at, expires_at]);
        } catch (logError) {
            console.error("Failed to create log entry:", logError);
            // Continue execution - logging failure shouldn't break login
        }

        // Prepare clean user data for response
        const userData = {
            id: user.id,
            name: `${user.first_name} ${user.last_name}`.trim(),
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            profile: user.profile_picture,
            sessionId: user.hashed_id,
            hashed_id: user.hashed_id,
            department: user.department,
            school: {
                id: user.school,
                name: user.school_name || null
            },
            college: {
                id: user.college_id || null,
                name: user.college_name || null
            },
            institution: {
                id: user.institution_id || null,
                name: user.institution_name || null
            }
        };

        console.log(`Login process completed successfully for user: ${user.email}`);

        // Return success response with structured data
        return createResponse(
            true,
            "Login credentials verified successfully. A verification code has been sent to your email address.",
            200,
            {
                user: userData,
                requiresOTP: true,
                nextStep: "Please enter the 6-digit verification code sent to your email to complete the login process.",
                otpValidityMinutes: 10
            }
        );

    } catch (error) {
        // Enhanced error logging
        console.error("Login system error:", {
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            userId: requestBody?.login || "unknown",
            timestamp: new Date().toISOString(),
            clientIP
        });

        // Return user-friendly error message
        return createResponse(
            false,
            "A system error occurred while processing your login. Please try again in a few moments.",
            500,
            process.env.NODE_ENV === 'development' ? {
                errorDetails: error instanceof Error ? error.message : "Unknown error"
            } : undefined
        );
    }
}
//app/api/auth/supervisor-verify-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import client from "../../utils/db";
import crypto from "crypto";

// Helper function to hash the password using SHA-256
async function hashPassword(password: string): Promise<string> {
    const textEncoder = new TextEncoder();
    const encoded = textEncoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        const { supervisorId, password } = await req.json();

        // Input validation
        if (!supervisorId || !password) {
            return NextResponse.json({ 
                success: false, 
                message: "Supervisor ID and password are required" 
            }, { status: 400 });
        }

        // Convert supervisorId to integer
        const supervisorIdInt = parseInt(supervisorId, 10);
        console.log('Received supervisorId:', supervisorId, 'Converted to int:', supervisorIdInt);
        
        if (isNaN(supervisorIdInt)) {
            return NextResponse.json({ 
                success: false, 
                message: "Invalid supervisor ID format" 
            }, { status: 400 });
        }

        // Query supervisor by ID
        const sql = `
            SELECT id, password, status, email, first_name, last_name
            FROM supervisors 
            WHERE id = $1
        `;
        const result = await client.query(sql, [supervisorIdInt]);
        
        console.log('Database query result:', {
            rowCount: result.rowCount,
            supervisorFound: result.rows[0] ? 'Yes' : 'No',
            supervisorId: result.rows[0]?.id
        });

        if (result.rowCount === 0) {
            return NextResponse.json({ 
                success: false, 
                message: `Supervisor not found with ID: ${supervisorIdInt}` 
            }, { status: 404 });
        }

        const supervisor = result.rows[0];

        // Check if account is active
        if (supervisor.status?.toLowerCase() !== "active") {
            return NextResponse.json({ 
                success: false, 
                message: "Account is not active" 
            }, { status: 403 });
        }

        // Verify password
        const hashedInputPassword = await hashPassword(password);
        if (hashedInputPassword !== supervisor.password) {
            return NextResponse.json({ 
                success: false, 
                message: "Incorrect password" 
            }, { status: 401 });
        }

        return NextResponse.json({
            success: true,
            message: "Password verified successfully",
            supervisor: {
                id: supervisor.id,
                email: supervisor.email,
                name: `${supervisor.first_name} ${supervisor.last_name}`
            }
        }, { status: 200 });

    } catch (error) {
        console.error("Supervisor password verification error:", error);
        return NextResponse.json({ 
            success: false, 
            message: "Server error: " + (error instanceof Error ? error.message : "Unknown error occurred.") 
        }, { status: 500 });
    }
}
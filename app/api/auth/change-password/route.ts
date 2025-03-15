import { NextRequest, NextResponse } from "next/server";
import client from '../../utils/db';
import { sendChangePasswordConfirmationEmail } from "../../utils/config";



// Helper function to hash the password using SHA-256
async function hashPassword(password: string): Promise<string> {
  const textEncoder = new TextEncoder();
  const encoded = textEncoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
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

    const { hashed_id, password} = requestBody;

    // Input validation
    if (!hashed_id || !password) {
        return NextResponse.json({ message: "All fileds required." }, { status: 400 });
    }

    try {
         const hashedPassword = await hashPassword(password);
        const results = await client.query(`UPDATE supervisors SET password = $1, status = 'Active' WHERE hashed_id = $2 RETURNING *`, [
         hashedPassword,
         hashed_id,
        ]);
        const user = results.rows[0];

        await sendChangePasswordConfirmationEmail(user.email);
        // Send response with user data
        return NextResponse.json({
            message: "password successful!",
            user: {user: user}
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ message: "Server error: " + (error instanceof Error ? error.message : "Unknown error occurred.") }, { status: 500 });
    }
}

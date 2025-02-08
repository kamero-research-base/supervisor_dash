import { NextRequest, NextResponse } from "next/server";
import client from '../../utils/db';
import { sendChangePasswordVerificationEmail } from "../../utils/config";

// Function to generate a 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
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

    const { email } = requestBody;

    // Input validation
    if (!email) {
        return NextResponse.json({ message: "Enter your email." }, { status: 400 });
    }

    try {
        // Query user by email or phone
        const sql = "SELECT hashed_id FROM supervisors WHERE email = $1";
        const result = await client.query(sql, [email]);
        const user = result.rows[0];

        const verificationCode = generateVerificationCode();

        if(result.rowCount > 0){
        await client.query(`UPDATE supervisors SET verification_code = $1 WHERE hashed_id = $2`, [
         verificationCode,
         user.hashed_id,
        ]); 
        }else{
            return NextResponse.json({ message: "Email not found "}, { status: 500 });
        }

        await sendChangePasswordVerificationEmail(email, verificationCode);
        // Send response with user data
        return NextResponse.json({
            message: "Email checked successful!",
            user: {hashed_id: user.hashed_id}
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ message: "Server error: " + (error instanceof Error ? "Connection failed" : "Unknown error occurred.") }, { status: 500 });
    }
}

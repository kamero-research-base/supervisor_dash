import { NextRequest, NextResponse } from "next/server";
import client from "../../utils/db";
import jwt from 'jsonwebtoken';

// Define types for the verify request
type VerifyRequest = {
  code: string;
  hashed_id: string;
};

// Handle POST request for verification
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData();
    const verifyData: VerifyRequest = {
      code: formData.get("code")?.toString() || "",
      hashed_id: formData.get("hashed_id")?.toString() || "",
    };

    // Validate required fields
    if (!verifyData.code || !verifyData.hashed_id) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    // Check if the code exists in the database
    const checkQuery = `SELECT * FROM supervisors WHERE hashed_id = $1 AND verification_code = $2`;
    const checkResult = await client.query(checkQuery, [verifyData.hashed_id, verifyData.code]);

    if (checkResult.rowCount === 0) {
      return NextResponse.json({ message: "Invalid verification code" }, { status: 401 });
    }

    // Add 10 minutes to the updated_at timestamp
    const expirationTime = new Date(checkResult.rows[0].updated_at);
    expirationTime.setMinutes(expirationTime.getMinutes() + 10);

    /*if (expirationTime >= new Date()) {
      return NextResponse.json({ error: "Verification code expired" }, { status: 406 });
    }*/
    
    const user = checkResult.rows[0];
    
    // Clear the verification code
    const updateQuery = `UPDATE supervisors SET verification_code='NULL', last_login = NOW() WHERE hashed_id = $1`;
    await client.query(updateQuery, [verifyData.hashed_id]);

    // Generate JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`
      },
      JWT_SECRET,
      { expiresIn: '7d' } // Token expires in 7 days
    );

    // Create the response with the token
    const response = NextResponse.json({ 
      message: "Verified successfully",
      token: token,
      user: {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email
      }
    }, { status: 200 });

    // Set the token as an HTTP-only cookie for additional security
    response.cookies.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });
  
    return response;
  } catch (error) {
    console.error("Error during verification:", error);
    return NextResponse.json({ message: "Verification failed", error: (error as Error).message }, { status: 500 });
  }
}

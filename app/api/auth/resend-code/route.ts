import { NextRequest, NextResponse } from "next/server";
import client from "../../utils/db";
import { sendVerificationEmail } from "../../utils/config";

// Define types for the verify request
type VerifyRequest = {
  hashed_id: string;
};

// Handle POST request for verification
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.json();
   
      const { hashed_id } = formData;
    


    // Validate required fields
    if (!hashed_id) {
      return NextResponse.json({ error: "Failed try again!" }, { status: 400 });
    }

    // Check if the code exists in the database
    const checkQuery = `SELECT verification_code, email, first_name FROM supervisors WHERE hashed_id = $1`;
    const checkResult = await client.query(checkQuery, [hashed_id]);


    if (checkResult.rowCount === 0) {
      return NextResponse.json({ error: "Error occured" }, { status: 400 });
    }
    const email: string = checkResult.rows[0].email;
    const code: string = checkResult.rows[0].verification_code;
    const name: string = checkResult.rows[0].first_name;

    await sendVerificationEmail(email, code, name);

    return NextResponse.json({ message: "Verified successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error during verification:", error);
    return NextResponse.json({ message: "Verification failed", error: (error as Error).message }, { status: 500 });
  }
}

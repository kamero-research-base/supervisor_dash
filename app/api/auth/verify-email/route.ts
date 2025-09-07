import { NextRequest, NextResponse } from "next/server";
import client from "../../utils/db";

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
    // Check if the code exists in the database
    const updateQuery = `UPDATE supervisors SET status ='Active', verification_code='NULL' WHERE hashed_id = $1`;
    await client.query(updateQuery, [verifyData.hashed_id]);
  
    return NextResponse.json({ message: "Verified successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error during verification:", error);
    return NextResponse.json({ message: "Verification failed", error: (error as Error).message }, { status: 500 });
  }
}

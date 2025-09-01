export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import client from "../../../utils/db"; 

export async function GET() {
  try {
    let query = `SELECT 
      r.title,
      r.researcher
      FROM researches r
      WHERE r.title != ''`; 
    const result = await client.query(query);

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error("Error retrieving abstracts:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
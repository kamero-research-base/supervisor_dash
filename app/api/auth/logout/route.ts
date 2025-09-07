import { NextRequest, NextResponse } from "next/server";

// Handle POST request for logout
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Create response
    const response = NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 }
    );

    // Clear the session token cookie
    response.cookies.set('session_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(0), // Set expiration to past date to delete the cookie
      path: '/'
    });

    return response;

  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Server error: " + (error instanceof Error ? error.message : "Unknown error occurred.") 
      },
      { status: 500 }
    );
  }
}
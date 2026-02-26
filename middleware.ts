import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Ensure JWT_SECRET is defined
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error("JWT_SECRET not defined");
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  try {
    // Verify the JWT token and extract the payload
    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(token, secret);

    // Check if the payload contains the necessary user information
    if (!payload.userId || !payload.role) {
      return NextResponse.json({ error: "Invalid token payload" }, { status: 401 });
    }

    // Create new headers for the request to include user information
    const requestHeaders = new Headers(request.headers);

    // Add user information from the token payload to the request headers
    requestHeaders.set("x-user-id", String(payload.userId));
    requestHeaders.set("x-user-role", String(payload.role));

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  } catch (error) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }
}

export const config = {
  matcher: ["/api/protected/:path*"],
};
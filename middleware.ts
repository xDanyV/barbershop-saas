import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(request: NextRequest) {
    const token = request.cookies.get("token")?.value;

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret); // Verify the token and extract the payload
        //Paylod contains userId and role as defined in the login route
        const requestHeaders = new Headers(request.headers); // Create a mutable copy of the request headers
        //Request headers are immutable, so we create a new Headers object to modify them

        requestHeaders.set("x-user-id", payload.userId as string); // Add user ID to headers for downstream use

        
        return NextResponse.next({
            // Pass the modified headers to the next middleware
            request: {
                headers: requestHeaders,
            },
        });

    } catch (error) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
}

export const config = {
    matcher: ["/api/protected/:path*"],
};
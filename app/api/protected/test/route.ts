import { NextRequest, NextResponse } from "next/server";

// This route is protected by the middleware, so it will only be accessible if a valid JWT token is present in the cookies
export async function GET(request: NextRequest) {

    // The user ID is extracted from the custom header set in the middleware
    const userId = request.headers.get("x-user-id");

    return NextResponse.json({
        message: "You are authenticated",
        userId,
    });
}
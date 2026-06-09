import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const barberId = request.headers.get("x-barber-id");
    const businessId = request.headers.get("x-business-id");

    if (!barberId) {
        return NextResponse.json({ error: "Not a barber" }, { status: 403 });
    }

    return NextResponse.json({
        barberId,
        businessId,
    });
}
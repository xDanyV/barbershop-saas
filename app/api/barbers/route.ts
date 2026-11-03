import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public list of active barbers. Only exposes public profile data (no email/phone).
export async function GET(request: NextRequest) {
  try {
    const businessId = request.nextUrl.searchParams.get("businessId");

    const barbers = await prisma.barber.findMany({
      where: {
        active: true,
        status: "APPROVED",
        ...(businessId ? { businessId } : {}),
      },
      select: {
        id: true,
        businessId: true,
        profileImageUrl: true,
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(barbers);

  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
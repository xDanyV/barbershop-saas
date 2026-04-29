import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get all active barbers with their user profile
export async function GET() {
  try {
    const barbers = await prisma.barber.findMany({
      where: {
        active: true,
        status: "APPROVED"
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
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
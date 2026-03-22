import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get all active services for a specific barber
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barberId = searchParams.get("barberId");

    if (!barberId) {
      return NextResponse.json({ error: "barberId is required" }, { status: 400 });
    }

    const services = await prisma.service.findMany({
      where: {
        barberId,
        active: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(services);

  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public endpoint — returns barber exceptions so customers can see blocked dates
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ barberId: string }> }
) {
    try {
        const { barberId } = await context.params;

        const exceptions = await prisma.barberException.findMany({
            where: {
                barberId,
                endDate: { gte: new Date() }, // solo excepciones futuras o activas
            },
            select: {
                startDate: true,
                endDate: true,
            },
        });

        return NextResponse.json(exceptions);

    } catch {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
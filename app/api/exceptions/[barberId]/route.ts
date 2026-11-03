import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveTimezone, toDateKey } from "@/lib/time/zoned";

// Public endpoint — returns barber exceptions so customers can see blocked dates.
// Dates are returned as YYYY-MM-DD in the business timezone.
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ barberId: string }> }
) {
    try {
        const { barberId } = await context.params;

        const barber = await prisma.barber.findUnique({
            where: { id: barberId },
            select: {
                business: {
                    select: { timezone: true },
                },
            },
        });

        if (!barber) {
            return NextResponse.json([]);
        }

        const timezone = resolveTimezone(barber.business.timezone);

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

        return NextResponse.json(
            exceptions.map((e) => ({
                startDate: toDateKey(e.startDate, timezone),
                endDate: toDateKey(e.endDate, timezone),
            }))
        );

    } catch {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

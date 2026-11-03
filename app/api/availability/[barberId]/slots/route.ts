import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/errors";
import { getBarberDay } from "@/lib/services/booking.service";
import { isValidDateKey } from "@/lib/time/zoned";

// Public endpoint — free slots for a barber on a given day (YYYY-MM-DD in the business timezone)
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ barberId: string }> }
) {
    try {
        const { barberId } = await context.params;
        const date = request.nextUrl.searchParams.get("date");

        if (!isValidDateKey(date)) {
            return NextResponse.json(
                { error: "date is required (YYYY-MM-DD)" },
                { status: 400 }
            );
        }

        const barber = await prisma.barber.findFirst({
            where: {
                id: barberId,
                active: true,
                status: "APPROVED",
            },
            select: {
                business: {
                    select: { timezone: true },
                },
            },
        });

        if (!barber) {
            return NextResponse.json({ error: "Barber not found" }, { status: 404 });
        }

        const day = await getBarberDay(prisma, barberId, date, barber.business.timezone);

        return NextResponse.json({
            timezone: day.timezone,
            schedule: day.schedule
                ? {
                    startTime: day.schedule.startTime,
                    endTime: day.schedule.endTime,
                }
                : null,
            slots: day.slots.map((slot) => ({
                start: slot.start.toISOString(),
                label: slot.label,
                maxMinutes: slot.maxMinutes,
            })),
        });
    } catch (error) {
        return errorResponse(error, "Get barber slots error");
    }
}

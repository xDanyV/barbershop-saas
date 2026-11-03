import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addDaysToKey, isValidDateKey, resolveTimezone, zonedToUtc } from "@/lib/time/zoned";

function canManageExceptions(role: string | null) {
    return role === "BARBER" || role === "OWNER" || role === "ADMIN";
}

export async function POST(request: NextRequest) {
    try {
        const role = request.headers.get("x-user-role");
        const barberId = request.headers.get("x-barber-id");
        const businessId = request.headers.get("x-business-id");

        if (!canManageExceptions(role) || !barberId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { startDate, endDate, reason } = body;

        if (!startDate || !endDate) {
            return NextResponse.json(
                { error: "startDate and endDate are required" },
                { status: 400 }
            );
        }

        const startKey = typeof startDate === "string" ? startDate.split("T")[0] : "";
        const endKey = typeof endDate === "string" ? endDate.split("T")[0] : "";

        if (!isValidDateKey(startKey) || !isValidDateKey(endKey)) {
            return NextResponse.json(
                { error: "Dates must be in YYYY-MM-DD format" },
                { status: 400 }
            );
        }

        const barber = await prisma.barber.findUnique({
            where: { id: barberId },
            select: {
                id: true,
                businessId: true,
                business: {
                    select: { timezone: true },
                },
            },
        });

        if (!barber) {
            return NextResponse.json({ error: "Barber not found" }, { status: 404 });
        }

        if (role === "OWNER" && businessId && barber.businessId !== businessId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Días completos en la zona horaria del negocio
        const timezone = resolveTimezone(barber.business.timezone);
        const start = zonedToUtc(startKey, "00:00", timezone);
        const end = new Date(zonedToUtc(addDaysToKey(endKey, 1), "00:00", timezone).getTime() - 1);

        if (start > end) {
            return NextResponse.json(
                { error: "startDate cannot be after endDate" },
                { status: 400 }
            );
        }

        const result = await prisma.$transaction(async (tx) => {
            const exception = await tx.barberException.create({
                data: {
                    barberId: barber.id,
                    startDate: start,
                    endDate: end,
                    reason: reason ?? null,
                },
            });

            const cancelledAppointments = await tx.appointment.updateMany({
                where: {
                    barberId: barber.id,
                    businessId: barber.businessId,
                    status: { in: ["PENDING", "CONFIRMED"] },
                    date: { gte: start, lte: end },
                },
                data: { status: "CANCELLED" },
            });

            return {
                exception,
                cancelledCount: cancelledAppointments.count,
            };
        });

        return NextResponse.json(
            {
                ...result.exception,
                appointmentsCancelled: result.cancelledCount,
                cancelledCount: result.cancelledCount,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Exception creation error:", error);

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
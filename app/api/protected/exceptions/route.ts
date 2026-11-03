import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AppError, errorResponse } from "@/lib/errors";
import { requireBarberAuth } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/validation";
import { createExceptionSchema } from "@/lib/validations/schemas";
import { addDaysToKey, resolveTimezone, zonedToUtc } from "@/lib/time/zoned";

export async function POST(request: NextRequest) {
    try {
        const { barberId } = requireBarberAuth(request);
        const { startDate, endDate, reason } = await parseJsonBody(request, createExceptionSchema);

        // x-barber-id es el perfil propio o un barbero del negocio del OWNER (validado por el proxy)
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
            throw new AppError("Barber not found", 404);
        }

        // Días completos en la zona horaria del negocio
        const timezone = resolveTimezone(barber.business.timezone);
        const start = zonedToUtc(startDate, "00:00", timezone);
        const end = new Date(zonedToUtc(addDaysToKey(endDate, 1), "00:00", timezone).getTime() - 1);

        const result = await prisma.$transaction(async (tx) => {
            const exception = await tx.barberException.create({
                data: {
                    barberId: barber.id,
                    startDate: start,
                    endDate: end,
                    reason,
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
        return errorResponse(error, "Exception creation error");
    }
}

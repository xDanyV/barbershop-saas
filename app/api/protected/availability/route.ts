import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/errors";
import { requireBarberAuth } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/validation";
import { availabilitySchema } from "@/lib/validations/schemas";
import { revalidateBusinessPages } from "@/lib/cache/business-pages";

export async function GET(request: NextRequest) {
    try {
        const { barberId } = requireBarberAuth(request);

        const availability = await prisma.availability.findMany({
            where: {
                barberId,
            },
            orderBy: {
                dayOfWeek: "asc",
            },
        });

        return NextResponse.json(availability);
    } catch (error) {
        return errorResponse(error, "Availability GET error");
    }
}

export async function POST(request: NextRequest) {
    try {
        const { barberId } = requireBarberAuth(request);
        const { days, startTime, endTime, breakStart, breakEnd } = await parseJsonBody(
            request,
            availabilitySchema
        );

        // Reemplazo atómico: si falla la creación no se pierde el horario anterior
        const [, availability] = await prisma.$transaction([
            prisma.availability.deleteMany({
                where: { barberId },
            }),
            prisma.availability.createMany({
                data: days.map((day) => ({
                    barberId,
                    dayOfWeek: day,
                    startTime,
                    endTime,
                    breakStart: breakStart ?? null,
                    breakEnd: breakEnd ?? null,
                })),
            }),
        ]);

        const barber = await prisma.barber.findUnique({
            where: { id: barberId },
            select: { businessId: true },
        });
        await revalidateBusinessPages(barber?.businessId);

        return NextResponse.json(availability);
    } catch (error) {
        return errorResponse(error, "Availability POST error");
    }
}

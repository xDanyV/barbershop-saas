import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidTime, timeToMinutes } from "@/lib/time/zoned";

function canManageAvailability(role: string | null) {
    return role === "BARBER" || role === "OWNER" || role === "ADMIN";
}

export async function GET(request: NextRequest) {
    try {
        const role = request.headers.get("x-user-role");
        const barberId = request.headers.get("x-barber-id");

        if (!canManageAvailability(role) || !barberId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

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
        console.error("API Availability GET Error:", error);

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const role = request.headers.get("x-user-role");
        const barberId = request.headers.get("x-barber-id");

        if (!canManageAvailability(role) || !barberId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { days, startTime, endTime, breakStart, breakEnd } = body;

        if (!Array.isArray(days) || days.length === 0 || !startTime || !endTime) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const validDays =
            days.every((day) => Number.isInteger(day) && day >= 0 && day <= 6) &&
            new Set(days).size === days.length;

        if (!validDays) {
            return NextResponse.json({ error: "Invalid days" }, { status: 400 });
        }

        if (!isValidTime(startTime) || !isValidTime(endTime)) {
            return NextResponse.json({ error: "Times must be in HH:mm format" }, { status: 400 });
        }

        if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
            return NextResponse.json({ error: "startTime must be before endTime" }, { status: 400 });
        }

        const hasBreak = Boolean(breakStart || breakEnd);

        if (hasBreak) {
            if (!isValidTime(breakStart) || !isValidTime(breakEnd)) {
                return NextResponse.json({ error: "Break needs a valid start and end (HH:mm)" }, { status: 400 });
            }

            const breakStartMin = timeToMinutes(breakStart);
            const breakEndMin = timeToMinutes(breakEnd);

            if (
                breakStartMin >= breakEndMin ||
                breakStartMin < timeToMinutes(startTime) ||
                breakEndMin > timeToMinutes(endTime)
            ) {
                return NextResponse.json({ error: "Break must be inside working hours" }, { status: 400 });
            }
        }

        // Reemplazo atómico: si falla la creación no se pierde el horario anterior
        const [, availability] = await prisma.$transaction([
            prisma.availability.deleteMany({
                where: { barberId },
            }),
            prisma.availability.createMany({
                data: days.map((day: number) => ({
                    barberId,
                    dayOfWeek: day,
                    startTime,
                    endTime,
                    breakStart: hasBreak ? breakStart : null,
                    breakEnd: hasBreak ? breakEnd : null,
                })),
            }),
        ]);

        return NextResponse.json(availability);
    } catch (error) {
        console.error("API Availability POST Error:", error);

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
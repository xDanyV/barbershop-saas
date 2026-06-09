import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

        await prisma.availability.deleteMany({
            where: { barberId },
        });

        const availability = await prisma.availability.createMany({
            data: days.map((day: number) => ({
                barberId,
                dayOfWeek: day,
                startTime,
                endTime,
                breakStart: breakStart || null,
                breakEnd: breakEnd || null,
            })),
        });

        return NextResponse.json(availability);
    } catch (error) {
        console.error("API Availability POST Error:", error);

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
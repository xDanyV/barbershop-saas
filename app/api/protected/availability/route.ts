import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const role = request.headers.get("x-user-role");
        const userId = request.headers.get("x-user-id");

        if (role !== "BARBER" || !userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Find the barber associated with the user ID from the token
        const barber = await prisma.barber.findUnique({
            where: { userId },
        });

        if (!barber) {
            return NextResponse.json({ error: "Barber not found" }, { status: 404 });
        }

        // Fetch the availability for the found barber
        const availability = await prisma.availability.findMany({
            where: {
                barberId: barber.id,
            },
        });

        return NextResponse.json(availability);

    } catch {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const role = request.headers.get("x-user-role");
        const userId = request.headers.get("x-user-id");

        if (role !== "BARBER" || !userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const barber = await prisma.barber.findUnique({
            where: { userId },
        });

        if (!barber) {
            return NextResponse.json({ error: "Barber not found" }, { status: 404 });
        }

        const body = await request.json();
        const { days, startTime, endTime } = body;

        await prisma.availability.deleteMany({
            where: { barberId: barber.id },
        });

        const availability = await prisma.availability.createMany({
            data: days.map((day: number) => ({
                barberId: barber.id,
                dayOfWeek: day,
                startTime,
                endTime,
            })),
        });

        return NextResponse.json(availability);

    } catch {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
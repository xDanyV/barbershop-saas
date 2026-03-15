import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Returns booked time slots for a barber within a UTC date range
// Accessible by any authenticated user (customer or barber)
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ barberId: string }> }
) {
    try {
        const { barberId } = await context.params;
        const { searchParams } = new URL(request.url);

        const startParam = searchParams.get("start");
        const endParam = searchParams.get("end");

        if (!startParam || !endParam) {
            return NextResponse.json(
                { error: "start and end are required" },
                { status: 400 }
            );
        }

        const start = new Date(startParam);
        const end = new Date(endParam);

        const appointments = await prisma.appointment.findMany({
            where: {
                barberId,
                status: { in: ["PENDING", "CONFIRMED"] },
                date: { gte: start, lte: end },
            },
            select: { date: true },
        });

        // Format times using the local time of the server matches the client
        const bookedSlots = appointments.map((a) =>
            new Date(a.date).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
            })
        );

        return NextResponse.json(bookedSlots);

    } catch (error) {
        console.error("Error fetching booked slots:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
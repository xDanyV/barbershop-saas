import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ barberId: string }> }
) {
    try {
        const { barberId } = await context.params;
        const { searchParams } = new URL(request.url);

        const startParam = searchParams.get("start");
        const endParam = searchParams.get("end");

        // The client also sends its timezone offset so we can format
        // slot times in the user's local timezone, not the server's (UTC).
        const tzOffset = parseInt(searchParams.get("tzOffset") ?? "0", 10);

        if (!startParam || !endParam) {
            return NextResponse.json(
                { error: "start and end are required" },
                { status: 400 }
            );
        }

        const start = new Date(startParam);
        const end = new Date(endParam);
        const now = new Date();

        const appointments = await prisma.appointment.findMany({
            where: {
                barberId,
                status: { in: ["PENDING", "CONFIRMED", "CANCELLED"] },
                date: { gte: start, lte: end },
            },
            select: { date: true, status: true },
        });

        const bookedSlots = appointments
            .filter((a: any) => {
                // PENDING and CONFIRMED always block the slot
                if (a.status !== "CANCELLED") return true;

                // CANCELLED only blocks within the 2-hour window
                const hoursUntil =
                    (new Date(a.date).getTime() - now.getTime()) / (1000 * 60 * 60);
                return hoursUntil < 2;
            })
            .map((a: any) => {
                // Apply the client's UTC offset so the formatted time matches
                // what generateSlots() produces in the browser.
                // tzOffset is getTimezoneOffset() which returns minutes BEHIND UTC
                // (e.g. UTC-6 → 360, UTC+1 → -60).
                const utcMs = new Date(a.date).getTime();
                const localMs = utcMs - tzOffset * 60 * 1000;
                const localDate = new Date(localMs);

                const hours = localDate.getUTCHours();
                const minutes = localDate.getUTCMinutes();
                const period = hours >= 12 ? "PM" : "AM";
                const hours12 = hours % 12 || 12;

                return `${hours12.toString().padStart(2, "0")}:${minutes
                    .toString()
                    .padStart(2, "0")} ${period}`;
            });

        return NextResponse.json(bookedSlots);

    } catch (error) {
        console.error("Error fetching booked slots:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
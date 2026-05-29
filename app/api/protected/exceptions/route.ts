import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const userId = request.headers.get("x-user-id");
        const role = request.headers.get("x-user-role");

        if (!userId || (role !== "BARBER" && role !== "ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const barber = await prisma.barber.findUnique({ where: { userId } });

        if (!barber) {
            return NextResponse.json({ error: "Barber not found" }, { status: 404 });
        }

        const body = await request.json();
        const { startDate, endDate, reason } = body;

        if (!startDate || !endDate) {
            return NextResponse.json(
                { error: "startDate and endDate are required" },
                { status: 400 }
            );
        }

        const [sYear, sMonth, sDay] = startDate.split("T")[0].split("-").map(Number);
        const [eYear, eMonth, eDay] = endDate.split("T")[0].split("-").map(Number);

        const start = new Date(Date.UTC(sYear, sMonth - 1, sDay, 0, 0, 0, 0));
        const end = new Date(Date.UTC(eYear, eMonth - 1, eDay, 23, 59, 59, 999));

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
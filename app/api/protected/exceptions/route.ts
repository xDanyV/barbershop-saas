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
            return NextResponse.json({ error: "startDate and endDate are required" }, { status: 400 });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        // Creates the exception
        const exception = await prisma.barberException.create({
            data: {
                barberId: barber.id,
                startDate: start,
                endDate: end,
                reason: reason ?? null,
            },
        });

        // Cancels any appointments that fall within the exception period
        await prisma.appointment.updateMany({
            where: {
                barberId: barber.id,
                status: { in: ["PENDING", "CONFIRMED"] },
                date: { gte: start, lte: end },
            },
            data: { status: "CANCELLED" },
        });

        return NextResponse.json(exception, { status: 201 });

    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
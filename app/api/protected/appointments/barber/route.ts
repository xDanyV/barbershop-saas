import { NextRequest, NextResponse } from "next/server";
import { getBarberAppointments } from "@/lib/services/appointment.service";
import { prisma } from "@/lib/prisma";

// Get all appointments for the authenticated barber
export async function GET(request: NextRequest) {
    try {
        const userId = request.headers.get("x-user-id");

        // Check if user ID is present in headers (you can also implement proper authentication)
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });

        // Only allow access if the user is a barber
        if (!user || user.role !== "BARBER") {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        const barber = await prisma.barber.findUnique({
            where: { userId },
        });

        if (!barber) {
            return NextResponse.json(
                { error: "Barber not found" },
                { status: 404 }
            );
        }

        const appointments = await getBarberAppointments(barber.id);

        return NextResponse.json(appointments);

    } catch (error) {
        console.error("[GET /barber/appointments]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
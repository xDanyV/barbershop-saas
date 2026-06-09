import { NextRequest, NextResponse } from "next/server";
import { getBarberAppointments } from "@/lib/services/appointment.service";

function canViewBarberAppointments(role: string | null) {
    return role === "BARBER" || role === "OWNER" || role === "ADMIN";
}

export async function GET(request: NextRequest) {
    try {
        const role = request.headers.get("x-user-role");
        const barberId = request.headers.get("x-barber-id");

        if (!canViewBarberAppointments(role) || !barberId) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        const appointments = await getBarberAppointments(barberId);

        return NextResponse.json(appointments);
    } catch (error) {
        console.error("Get barber appointments error:", error);

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
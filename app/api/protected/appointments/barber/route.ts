import { NextRequest, NextResponse } from "next/server";
import { getBarberAppointments } from "@/lib/services/appointment.service";
import { errorResponse } from "@/lib/errors";
import { requireBarberAuth } from "@/lib/api/auth";

export async function GET(request: NextRequest) {
    try {
        const { barberId } = requireBarberAuth(request);

        return NextResponse.json(await getBarberAppointments(barberId));
    } catch (error) {
        return errorResponse(error, "Get barber appointments error");
    }
}

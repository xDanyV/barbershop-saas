import { NextRequest, NextResponse } from "next/server";
import { createManualAppointment } from "@/lib/services/appointment.service";
import { errorResponse } from "@/lib/errors";
import { requireBarberAuth } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/validation";
import { createManualAppointmentSchema } from "@/lib/validations/schemas";

// La barbería registra una cita de un cliente sin cuenta (llegó sin reservar o llamó por teléfono)
export async function POST(request: NextRequest) {
    try {
        const { barberId } = requireBarberAuth(request);
        const body = await parseJsonBody(request, createManualAppointmentSchema);

        const appointment = await createManualAppointment({ barberId, ...body });

        return NextResponse.json(appointment, { status: 201 });
    } catch (error) {
        return errorResponse(error, "Create manual appointment error");
    }
}

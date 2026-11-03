import { NextRequest, NextResponse } from "next/server";
import { createAppointment } from "@/lib/services/appointment.service";
import { AppError, errorResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/validation";
import { createAppointmentSchema } from "@/lib/validations/schemas";

//Create appointment endpoint
export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);

    // El proxy carga la sesión (incluido el ban) desde la base en cada petición
    if (auth.isBanned) {
      throw new AppError("Account suspended. You cannot book appointments.", 403);
    }

    const body = await parseJsonBody(request, createAppointmentSchema);

    if (body.userId && body.userId !== auth.userId) {
      throw new AppError("Forbidden", 403);
    }

    const appointment = await createAppointment({
      userId: auth.userId,
      barberId: body.barberId,
      serviceId: body.serviceId,
      date: body.date,
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Create appointment error");
  }
}

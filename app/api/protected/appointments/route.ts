import { NextRequest, NextResponse } from "next/server";
import { createAppointment } from "@/lib/services/appointment.service";
import { errorResponse } from "@/lib/errors";

//Create appointment endpoint
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // El proxy carga la sesión (incluido el ban) desde la base en cada petición
    if (request.headers.get("x-user-banned") === "true") {
      return NextResponse.json(
        { error: "Account suspended. You cannot book appointments." },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (body?.userId && body.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const appointment = await createAppointment({
      userId,
      barberId: body?.barberId,
      serviceId: body?.serviceId,
      date: body?.date,
    });

    return NextResponse.json(appointment, { status: 201 });

  } catch (error) {
    return errorResponse(error, "Create appointment error");
  }
}

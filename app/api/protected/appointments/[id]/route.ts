import { NextRequest, NextResponse } from "next/server";
import { updateAppointmentStatus } from "@/lib/services/appointment.service";
import { AppointmentStatus } from "@prisma/client";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get("x-user-id");
    const role = request.headers.get("x-user-role");

    if (!userId || !role) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();
    const { status } = body;

    const updatedAppointment = await updateAppointmentStatus(
      id,
      status as AppointmentStatus,
      userId,
      role
    );

    return NextResponse.json(updatedAppointment);

  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal error";

    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}

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
    const barberId = request.headers.get("x-barber-id");
    const businessId = request.headers.get("x-business-id");

    if (!userId || !role) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { status } = body as { status: AppointmentStatus };

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    const { id } = await context.params;

    const updated = await updateAppointmentStatus(
      id,
      status,
      userId,
      role,
      {
        barberId,
        businessId,
      }
    );

    return NextResponse.json(updated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal error";

    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
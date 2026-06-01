import { NextRequest, NextResponse } from "next/server";
import { createAppointment, getAllAppointments } from "@/lib/services/appointment.service";
import { prisma } from "@/lib/prisma";

//Create appointment endpoint
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isBanned: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.isBanned) {
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
    const message =
      error instanceof Error
        ? error.message
        : "Internal server error";

    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}

//Get all appointments (for admin)
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const appointments = await getAllAppointments();

    return NextResponse.json(appointments);

  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
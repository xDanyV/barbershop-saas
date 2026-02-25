import { NextRequest, NextResponse } from "next/server";
import { createAppointment, getAllAppointments } from "@/lib/services/appointment.service";

// Create a new appointment for the authenticated user
export async function POST(request: NextRequest) {
    try {
        const userId = request.headers.get("x-user-id");

        // Check if user ID is present in headers (you can also implement proper authentication)
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Parse the request body to get appointment details
        const body = await request.json();

        // Create the appointment using the service function
        const appointment = await createAppointment(body);

        // Return the created appointment
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

// Get all appointments for the authenticated user
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
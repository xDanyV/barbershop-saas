import { NextRequest, NextResponse } from "next/server";
import { getUserAppointments } from "@/lib/services/appointment.service";

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

    const appointments = await getUserAppointments(userId);

    return NextResponse.json(appointments);

  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
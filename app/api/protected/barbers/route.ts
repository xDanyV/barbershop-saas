import { NextRequest, NextResponse } from "next/server";
import { createBarberFromUser } from "@/lib/services/barber.service";

// Endpoint to create a barber profile for an authenticated user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    const barber = await createBarberFromUser(userId);

    return NextResponse.json(barber, { status: 201 });

  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal error";

    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
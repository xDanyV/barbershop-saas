import { NextRequest, NextResponse } from "next/server";
import { getUserAppointments } from "@/lib/services/appointment.service";
import { errorResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/api/auth";

// Get all appointments for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const { userId } = requireAuth(request);

    return NextResponse.json(await getUserAppointments(userId));
  } catch (error) {
    return errorResponse(error, "Get user appointments error");
  }
}

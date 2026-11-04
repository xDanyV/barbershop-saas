import { NextRequest, NextResponse } from "next/server";
import { assertAppointmentRange, getBarberAppointments } from "@/lib/services/appointment.service";
import { AppError, errorResponse } from "@/lib/errors";
import { requireBarberAuth } from "@/lib/api/auth";
import { isValidDateKey } from "@/lib/time/zoned";

export async function GET(request: NextRequest) {
    try {
        const { barberId } = requireBarberAuth(request);

        const from = request.nextUrl.searchParams.get("from");
        const to = request.nextUrl.searchParams.get("to");

        if (from || to) {
            if (!isValidDateKey(from) || !isValidDateKey(to)) {
                throw new AppError("from and to must be YYYY-MM-DD");
            }

            assertAppointmentRange(from, to);
        }

        return NextResponse.json(await getBarberAppointments(barberId, { from, to }));
    } catch (error) {
        return errorResponse(error, "Get barber appointments error");
    }
}

import { NextRequest, NextResponse } from "next/server";
import { actsAsCustomer, getRescheduleSlots, rescheduleAppointment } from "@/lib/services/appointment.service";
import { notifyAppointmentLater } from "@/lib/notifications/appointments";
import { RATE_LIMITS, consumeRateLimit } from "@/lib/rate-limit";
import { AppError, errorResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/validation";
import { rescheduleAppointmentSchema } from "@/lib/validations/schemas";
import { isValidDateKey } from "@/lib/time/zoned";

type RouteContext = { params: Promise<{ id: string }> };

// Horarios libres para mover esta cita; su propio horario no cuenta como ocupado
export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const auth = requireAuth(request);
        const { id } = await context.params;
        const date = request.nextUrl.searchParams.get("date");

        if (!isValidDateKey(date)) {
            throw new AppError("date is required (YYYY-MM-DD)");
        }

        return NextResponse.json({ slots: await getRescheduleSlots(id, date, auth) });
    } catch (error) {
        return errorResponse(error, "Get reschedule slots error");
    }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
    try {
        const auth = requireAuth(request);

        if (auth.isBanned) {
            throw new AppError("Account suspended. You cannot book appointments.", 403);
        }

        // El cliente comparte el límite de reservas: mover citas en ráfaga también ocupa la agenda
        if (auth.role === "CUSTOMER") {
            await consumeRateLimit(`booking:user:${auth.userId}`, RATE_LIMITS.bookingUser);
        }

        const { id } = await context.params;
        const { date } = await parseJsonBody(request, rescheduleAppointmentSchema);

        const updated = await rescheduleAppointment(id, date, auth);
        notifyAppointmentLater(updated.id, actsAsCustomer(updated, auth) ? "rescheduledByCustomer" : "rescheduledByBusiness");

        return NextResponse.json(updated);
    } catch (error) {
        return errorResponse(error, "Reschedule appointment error");
    }
}

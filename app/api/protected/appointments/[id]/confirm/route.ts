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

        if (role !== "BARBER" && role !== "OWNER" && role !== "ADMIN") {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        const { id } = await context.params;

        const updated = await updateAppointmentStatus(
            id,
            AppointmentStatus.CONFIRMED,
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
            error instanceof Error ? error.message : "Could not confirm appointment";

        return NextResponse.json(
            { error: message },
            { status: 400 }
        );
    }
}
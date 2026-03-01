import { NextRequest, NextResponse } from "next/server";
import { updateAppointmentStatus } from "@/lib/services/appointment.service";
import { AppointmentStatus } from "@prisma/client";

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
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

        const body = await request.json();
        const { status } = body as { status: AppointmentStatus };

        if (!status) {
            return NextResponse.json(
                { error: "Status is required" },
                { status: 400 }
            );
        }

        const updated = await updateAppointmentStatus(params.id, status, userId, role);

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
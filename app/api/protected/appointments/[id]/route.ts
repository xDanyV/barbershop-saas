import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Check if user is authenticated (you can implement proper authentication here)
        const userId = request.headers.get("x-user-id");

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if the appointment exists and belongs to the user
        const appointment = await prisma.appointment.findUnique({
            where: { id: params.id },
        });

        // If appointment doesn't exist or doesn't belong to the user, return error
        if (!appointment || appointment.userId !== userId) {
            return NextResponse.json(
                { error: "Not allowed" },
                { status: 403 }
            );
        }

        const updatedAppointment = await prisma.appointment.update({
            where: { id: params.id },
            data: {
                status: "CANCELLED",
            },
        });

        return NextResponse.json(updatedAppointment);

    } catch (error) {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
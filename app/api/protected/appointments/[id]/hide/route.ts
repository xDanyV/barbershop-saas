import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AppError, errorResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/api/auth";

// El cliente quita una cita pasada o cancelada de su historial. La barbería la conserva.
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = requireAuth(request);
        const { id } = await context.params;

        const appointment = await prisma.appointment.findUnique({ where: { id }, select: { userId: true, status: true, date: true } });
        if (!appointment || appointment.userId !== userId) throw new AppError("Appointment not found", 404);

        const upcoming = (appointment.status === "PENDING" || appointment.status === "CONFIRMED") && appointment.date > new Date();
        if (upcoming) throw new AppError("Upcoming appointments can't be removed; cancel them instead", 400, "APPOINTMENT_UPCOMING");

        await prisma.appointment.update({ where: { id }, data: { customerHiddenAt: new Date() } });

        return NextResponse.json({ hidden: true });
    } catch (error) {
        return errorResponse(error, "Hide appointment error");
    }
}

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const updated = await prisma.appointment.updateMany({
        where: {
            status: "CONFIRMED",
            date: {
                lt: oneHourAgo,
            },
        },
        data: {
            status: "COMPLETED",
        },
    });

    return NextResponse.json({
        updated: updated.count,
    });
}
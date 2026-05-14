import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";


export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
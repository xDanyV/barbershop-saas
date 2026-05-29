import { prisma } from "@/lib/prisma";

export async function createException(data: {
    barberId: string;
    startDate: string;
    endDate: string;
    reason?: string;
}) {
    const { barberId, startDate, endDate, reason } = data;

    if (!barberId || !startDate || !endDate) {
        throw new Error("Barber, start date, and end date are required");
    }

    const [sy, sm, sd] = startDate.split("T")[0].split("-").map(Number);
    const [ey, em, ed] = endDate.split("T")[0].split("-").map(Number);


    const start = new Date(Date.UTC(sy, sm - 1, sd, 0, 0, 0, 0));
    const end = new Date(Date.UTC(ey, em - 1, ed, 23, 59, 59, 999));

    if (start > end) {
        throw new Error("Start date cannot be after end date");
    }

    const result = await prisma.$transaction(async (tx) => {


        const exception = await tx.barberException.create({
            data: {
                barberId,
                startDate: start,
                endDate: end,
                reason: reason ?? null,
            },
        });

        const affectedAppointments = await tx.appointment.findMany({
            where: {
                barberId,
                status: { in: ["PENDING", "CONFIRMED"] },
                date: {
                    gte: start,
                    lte: end,
                },
            },
            select: { id: true },
        });

        const cancelledCount = affectedAppointments.length > 0
            ? await tx.appointment.updateMany({
                where: {
                    id: { in: affectedAppointments.map((a) => a.id) },
                },
                data: { status: "CANCELLED" },
            })
            : { count: 0 };

        return {
            exception,
            cancelledCount: cancelledCount.count,
        };
    });

    return result;
}
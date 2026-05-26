import { prisma } from "@/lib/prisma";

export async function createExceptionAndCancelAppointments(
    barberId: string,
    startDate: Date,
    endDate: Date,
    // reason?: string
) {

    return await prisma.$transaction(async (tx) => {

        const newException = await tx.barberException.create({
            data: {
                barberId,
                startDate,
                endDate,
            },
        });

        const cancelledAppointments = await tx.appointment.updateMany({
            where: {
                barberId: barberId,
                date: {
                    gte: startDate,
                    lte: endDate,  
                },
                status: {
                    in: ["PENDING", "CONFIRMED"],
                },
            },
            data: {
                status: "CANCELLED",
            },
        });

        return {
            exception: newException,
            cancelledCount: cancelledAppointments.count,
        };
    });
}
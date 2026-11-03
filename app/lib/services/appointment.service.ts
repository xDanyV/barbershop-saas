import { prisma } from "@/lib/prisma";
import { AppointmentStatus } from "@prisma/client";
import { canBusinessAcceptBookings } from "@/lib/billing/status";
import { AppError } from "@/lib/errors";
import { getBarberDay, lockKeys } from "@/lib/services/booking.service";
import { resolveTimezone, toDateKey } from "@/lib/time/zoned";

const MAX_ACTIVE_APPOINTMENTS = 2;

export async function createAppointment(data: {
    userId: string;
    barberId: string;
    serviceId: string;
    date: string;
}) {
    const { userId, barberId, serviceId, date } = data;

    if (!date || !serviceId || !barberId) {
        throw new AppError("Date, service, and barber are required");
    }

    const startDate = new Date(date);

    if (Number.isNaN(startDate.getTime())) {
        throw new AppError("Invalid date");
    }

    if (startDate.getTime() <= Date.now()) {
        throw new AppError("Cannot book in the past");
    }

    const barber = await prisma.barber.findUnique({
        where: { id: barberId },
        select: {
            id: true,
            active: true,
            status: true,
            businessId: true,
            business: {
                select: {
                    active: true,
                    billingStatus: true,
                    timezone: true,
                    settings: {
                        select: {
                            isServiceActive: true,
                        },
                    },
                },
            },
        },
    });

    if (!barber || !barber.active || barber.status !== "APPROVED") {
        throw new AppError("Barber not available");
    }

    if (!barber.business.active) {
        throw new AppError("Business is not active");
    }

    if (barber.business.settings && !barber.business.settings.isServiceActive) {
        throw new AppError("Business is temporarily closed");
    }

    if (!canBusinessAcceptBookings(barber.business.billingStatus)) {
        throw new AppError("Business is not accepting bookings at this time");
    }

    const service = await prisma.service.findFirst({
        where: {
            id: serviceId,
            barberId,
            businessId: barber.businessId,
            active: true,
        },
        select: {
            id: true,
            duration: true,
        },
    });

    if (!service) {
        throw new AppError("Service not available for this barber");
    }

    const timezone = resolveTimezone(barber.business.timezone);
    const dateKey = toDateKey(startDate, timezone);

    // Todo lo que depende del estado actual de la agenda se revisa con el lock tomado
    return prisma.$transaction(async (tx) => {
        await lockKeys(tx, `barber:${barberId}`, `user:${userId}`);

        const activeUpcomingAppointments = await tx.appointment.count({
            where: {
                userId,
                status: {
                    in: ["PENDING", "CONFIRMED"],
                },
                date: {
                    gt: new Date(),
                },
            },
        });

        if (activeUpcomingAppointments >= MAX_ACTIVE_APPOINTMENTS) {
            throw new AppError("No puedes tener más de 2 citas activas programadas al mismo tiempo");
        }

        const day = await getBarberDay(tx, barberId, dateKey, timezone);
        const slot = day.slots.find((s) => s.start.getTime() === startDate.getTime());

        if (!slot) {
            throw new AppError("Time slot not available");
        }

        if (service.duration > slot.maxMinutes) {
            throw new AppError("The selected service does not fit in this time slot");
        }

        return tx.appointment.create({
            data: {
                userId,
                barberId,
                serviceId,
                businessId: barber.businessId,
                date: startDate,
            },
        });
    });
}

export async function getUserAppointments(userId: string) {
    return prisma.appointment.findMany({
        where: {
            userId,
            status: { not: "CANCELLED" },
        },
        orderBy: {
            date: "asc",
        },
        include: {
            barber: {
                include: {
                    user: {
                        select: {
                            name: true,
                        },
                    },
                },
            },
            service: true,
            business: true,
        },
    });
}

export async function getAllAppointments() {
    return await prisma.appointment.findMany({
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                },
            },
            barber: true,
            service: true,
            business: true,
        },
        orderBy: {
            date: "asc",
        },
    });
}

export async function getBarberAppointments(barberId: string) {
    if (!barberId) {
        throw new AppError("Barber ID is required");
    }

    return await prisma.appointment.findMany({
        where: {
            barberId,
            status: { not: "CANCELLED" },
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                },
            },
            service: true,
            business: true,
        },
        orderBy: {
            date: "asc",
        },
    });
}

const allowedTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["CANCELLED"],
    CANCELLED: [],
    COMPLETED: [],
};

export async function updateAppointmentStatus(
    appointmentId: string,
    newStatus: AppointmentStatus,
    userId: string,
    role: string,
    context?: {
        barberId?: string | null;
        businessId?: string | null;
    }
) {
    if (!appointmentId) {
        throw new AppError("Appointment ID is required");
    }

    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
            barber: {
                select: {
                    id: true,
                    userId: true,
                    businessId: true,
                },
            },
        },
    });

    if (!appointment) {
        throw new AppError("Appointment not found", 404);
    }

    const currentStatus = appointment.status;
    const isAllowed = allowedTransitions[currentStatus].includes(newStatus);

    if (!isAllowed) {
        throw new AppError(
            `Cannot change status from ${currentStatus} to ${newStatus}`
        );
    }

    if (role === "CUSTOMER") {
        if (newStatus !== "CANCELLED") {
            throw new AppError("Customers can only cancel appointments");
        }

        if (appointment.userId !== userId) {
            throw new AppError("Not authorized", 403);
        }

        const now = new Date();
        const appointmentDate = new Date(appointment.date);
        const hoursUntilAppointment =
            (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursUntilAppointment < 2) {
            throw new AppError(
                "Appointments cannot be cancelled less than 2 hours before the scheduled time"
            );
        }
    } else if (role === "BARBER") {
        if (!context?.barberId || appointment.barberId !== context.barberId) {
            throw new AppError("Not authorized", 403);
        }
    } else if (role === "OWNER") {
        if (!context?.businessId || appointment.businessId !== context.businessId) {
            throw new AppError("Not authorized", 403);
        }
    } else if (role !== "ADMIN") {
        throw new AppError("Not authorized", 403);
    }

    return prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: newStatus },
    });
}
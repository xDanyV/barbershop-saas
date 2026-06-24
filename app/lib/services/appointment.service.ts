import { prisma } from "@/lib/prisma";
import { validateAppointmentDate } from "@/lib/validations/appointment.validation";
import { AppointmentStatus } from "@prisma/client/edge";
import { canBusinessAcceptBookings } from "@/lib/billing/status";

export async function createAppointment(data: {
    userId: string;
    barberId: string;
    serviceId: string;
    date: string;
}) {
    const { userId, barberId, serviceId, date } = data;

    if (!date || !serviceId || !barberId) {
        throw new Error("Date, service, and barber are required");
    }

    const barber = await prisma.barber.findUnique({
        where: { id: barberId },
        select: {
            id: true,
            active: true,
            businessId: true,
            business: {
                select: {
                    active: true,
                    billingStatus: true,
                },
            },
        },
    });

    if (!barber || !barber.active) {
        throw new Error("Barber not available");
    }

    if (!barber.business.active) {
        throw new Error("Business is not active");
    }

    if (!canBusinessAcceptBookings(barber.business.billingStatus)) {
        throw new Error("Business is not accepting bookings at this time");
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
            businessId: true,
        },
    });

    if (!service) {
        throw new Error("Service not available for this barber");
    }

    const startDate = new Date(date);

    const validationError = validateAppointmentDate(startDate);
    if (validationError) {
        throw new Error(validationError);
    }

    const now = new Date();
    const activeUpcomingAppointments = await prisma.appointment.count({
        where: {
            userId,
            status: {
                in: ["PENDING", "CONFIRMED"],
            },
            date: {
                gt: now,
            },
        },
    });

    if (activeUpcomingAppointments >= 2) {
        throw new Error("No puedes tener más de 2 citas activas programadas al mismo tiempo");
    }

    const existing = await prisma.appointment.findFirst({
        where: {
            businessId: barber.businessId,
            barberId,
            date: startDate,
            status: {
                in: ["PENDING", "CONFIRMED"],
            },
        },
    });

    if (existing) {
        throw new Error("Time slot not available");
    }

    const exception = await prisma.barberException.findFirst({
        where: {
            barberId,
            startDate: { lte: startDate },
            endDate: { gte: startDate },
        },
    });

    if (exception) {
        throw new Error("Barber is not available on this date");
    }

    return prisma.appointment.create({
        data: {
            userId,
            barberId,
            serviceId,
            businessId: barber.businessId,
            date: startDate,
        },
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
        throw new Error("Barber ID is required");
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
        throw new Error("Appointment ID is required");
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
        throw new Error("Appointment not found");
    }

    const currentStatus = appointment.status;
    const isAllowed = allowedTransitions[currentStatus].includes(newStatus);

    if (!isAllowed) {
        throw new Error(
            `Cannot change status from ${currentStatus} to ${newStatus}`
        );
    }

    if (role === "CUSTOMER") {
        if (newStatus !== "CANCELLED") {
            throw new Error("Customers can only cancel appointments");
        }

        if (appointment.userId !== userId) {
            throw new Error("Not authorized");
        }

        const now = new Date();
        const appointmentDate = new Date(appointment.date);
        const hoursUntilAppointment =
            (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursUntilAppointment < 2) {
            throw new Error(
                "Appointments cannot be cancelled less than 2 hours before the scheduled time"
            );
        }
    } else if (role === "BARBER") {
        if (!context?.barberId || appointment.barberId !== context.barberId) {
            throw new Error("Not authorized");
        }
    } else if (role === "OWNER") {
        if (!context?.businessId || appointment.businessId !== context.businessId) {
            throw new Error("Not authorized");
        }
    } else if (role !== "ADMIN") {
        throw new Error("Not authorized");
    }

    return prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: newStatus },
    });
}
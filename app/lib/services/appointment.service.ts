import { prisma } from "@/lib/prisma";
import { validateAppointmentDate } from "@/lib/validations/appointment.validation";
import { AppointmentStatus } from "@prisma/client/edge";

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

    // Check if barber exists and is active
    const barber = await prisma.barber.findUnique({
        where: { id: barberId },
    });

    if (!barber || !barber.active) {
        throw new Error("Barber not available");
    }

    const startDate = new Date(date);

    const validationError = validateAppointmentDate(startDate);
    if (validationError) {
        throw new Error(validationError);
    }

    // Check for existing appointments at the same time for the same barber
    const existing = await prisma.appointment.findFirst({
        where: {
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

    return prisma.appointment.create({
        data: {
            userId,
            barberId,
            serviceId,
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
            barber: true,
            service: true,
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
                    phone: true
                }
            },
            barber: true,
            service: true
        },
        orderBy: {
            date: "asc"
        }
    })
}

export async function getBarberAppointments(barberId: string) {
    if (!barberId) {
        throw new Error("Barber ID is required")
    }

    return await prisma.appointment.findMany({
        where: {
            barberId,
            status: { not: "CANCELLED" },
            date: { gte: new Date() }// Only future appointments
        },
        include: {
            user: {// Include user details but exclude sensitive info
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true
                }
            },
            service: true
        },
        orderBy: {
            date: "asc"
        }
    })
}

const allowedTransitions: Record<
    AppointmentStatus,
    AppointmentStatus[]
> = {
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["CANCELLED"],
    CANCELLED: [],
};

export async function updateAppointmentStatus(
  appointmentId: string,
  newStatus: AppointmentStatus,
  userId: string,
  role: string
) {
  if (!appointmentId) {
    throw new Error("Appointment ID is required");
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { barber: true },
  });

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  if (role === "BARBER") {
    if (appointment.barber.userId !== userId) {
      throw new Error("Not authorized");
    }
  }

  const currentStatus = appointment.status;

  const isAllowed =
    allowedTransitions[currentStatus].includes(newStatus);

  if (!isAllowed) {
    throw new Error(
      `Cannot change status from ${currentStatus} to ${newStatus}`
    );
  }

  return prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: newStatus },
  });
}
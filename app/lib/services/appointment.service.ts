import { prisma } from "@/lib/prisma";
import { AppointmentStatus } from "@prisma/client";
import { canBusinessAcceptBookings, getBillingStatus } from "@/lib/billing/status";
import { AppError } from "@/lib/errors";
import { checkWorkingHours, getBarberDay, hasScheduleConflict, lockKeys } from "@/lib/services/booking.service";
import { addDaysToKey, resolveTimezone, toDateKey, zonedToUtc } from "@/lib/time/zoned";

export const MAX_ACTIVE_APPOINTMENTS = 2;
const USER_APPOINTMENTS_LIMIT = 100;
const MAX_RANGE_DAYS = 93;

// Citas próximas que aún cuentan para el límite de reservas en una barbería
export function countActiveAppointments(userId: string, businessId: string) {
    return prisma.appointment.count({
        where: { userId, businessId, status: { in: ["PENDING", "CONFIRMED"] }, date: { gt: new Date() } },
    });
}

// ¿La barbería bloqueó a este cliente?
export async function isBannedFromBusiness(userId: string, businessId: string) {
    const ban = await prisma.businessCustomerBan.findUnique({
        where: { businessId_userId: { businessId, userId } },
        select: { id: true },
    });
    return Boolean(ban);
}

// El cliente puede cancelar o mover su cita hasta 2 horas antes
const CUSTOMER_CHANGE_LIMIT_MS = 2 * 60 * 60 * 1000;

type Actor = {
    userId: string;
    role: string;
    barberId?: string | null;
    businessId?: string | null;
};

// Dueño del negocio, o barbero activo de su equipo (uno rechazado ya es solo un cliente)
export async function isBusinessStaff(userId: string, businessId: string) {
    const business = await prisma.business.findFirst({
        where: {
            id: businessId,
            OR: [
                { ownerId: userId },
                { barbers: { some: { userId, active: true, status: { not: "REJECTED" } } } },
            ],
        },
        select: { id: true },
    });

    return business !== null;
}

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
                    subscription: { select: { billingStatus: true } },
                    timezone: true,
                    settings: {
                        select: {
                            isServiceActive: true,
                            autoConfirm: true,
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

    if (!canBusinessAcceptBookings(getBillingStatus(barber.business.subscription))) {
        throw new AppError("Business is not accepting bookings at this time");
    }

    // El equipo usa "Agregar cita": una reserva propia inflaría las métricas y se confirmaría sola
    if (await isBusinessStaff(userId, barber.businessId)) {
        throw new AppError("Staff cannot book at their own business", 403, "OWN_BUSINESS");
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

    // Bloqueo del cliente en este negocio (el bloqueo global ya lo revisa la ruta)
    const businessBan = await prisma.businessCustomerBan.findUnique({
        where: { businessId_userId: { businessId: barber.businessId, userId } },
        select: { id: true },
    });

    if (businessBan) {
        throw new AppError("You cannot book appointments at this business", 403);
    }

    const timezone = resolveTimezone(barber.business.timezone);
    const dateKey = toDateKey(startDate, timezone);

    // Todo lo que depende del estado actual de la agenda se revisa con el lock tomado
    return prisma.$transaction(async (tx) => {
        await lockKeys(tx, `barber:${barberId}`, `user:${userId}`);

        const activeUpcomingAppointments = await tx.appointment.count({
            where: {
                userId,
                businessId: barber.businessId,
                status: {
                    in: ["PENDING", "CONFIRMED"],
                },
                date: {
                    gt: new Date(),
                },
            },
        });

        if (activeUpcomingAppointments >= MAX_ACTIVE_APPOINTMENTS) {
            throw new AppError("You cannot have more than 2 active appointments");
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
                // Sin ajustes guardados se confirma, igual que el valor por defecto
                status: barber.business.settings?.autoConfirm === false ? "PENDING" : "CONFIRMED",
            },
        });
    });
}

// Cita registrada por la barbería para un cliente sin cuenta. Queda confirmada de inmediato.
export async function createManualAppointment(data: {
    barberId: string;
    serviceId: string;
    date: string;
    time: string;
    name: string;
    phone?: string | null;
    allowOutsideHours?: boolean;
}) {
    const { barberId, serviceId, date, time, name, phone, allowOutsideHours } = data;

    const barber = await prisma.barber.findUnique({
        where: { id: barberId },
        select: {
            businessId: true,
            business: {
                select: {
                    timezone: true,
                    subscription: { select: { billingStatus: true } },
                },
            },
        },
    });

    if (!barber) {
        throw new AppError("Barber not available");
    }

    if (!canBusinessAcceptBookings(getBillingStatus(barber.business.subscription))) {
        throw new AppError("Business is not accepting bookings at this time");
    }

    const service = await prisma.service.findFirst({
        where: { id: serviceId, barberId, active: true },
        select: { id: true, duration: true },
    });

    if (!service) {
        throw new AppError("Service not available for this barber");
    }

    const timezone = resolveTimezone(barber.business.timezone);

    // Se permite hoy aunque la hora ya pasó: el cliente pudo llegar hace unos minutos
    if (date < toDateKey(new Date(), timezone)) {
        throw new AppError("Cannot add an appointment on a past day");
    }

    const start = zonedToUtc(date, time, timezone);

    // Fuera de horario, en descanso o en día libre se pide confirmar: a veces el barbero sí se queda
    if (!allowOutsideHours) {
        const hours = await checkWorkingHours(prisma, barberId, date, start, service.duration, timezone);
        if (hours !== "inside") {
            throw new AppError("That time is outside the working hours", 422, `OUTSIDE_HOURS:${hours}`);
        }
    }

    return prisma.$transaction(async (tx) => {
        await lockKeys(tx, `barber:${barberId}`);

        if (await hasScheduleConflict(tx, barberId, start, service.duration)) {
            throw new AppError("That time is not available", 409);
        }

        return tx.appointment.create({
            data: {
                barberId,
                serviceId,
                businessId: barber.businessId,
                date: start,
                status: "CONFIRMED",
                walkInName: name,
                walkInPhone: phone ?? null,
            },
        });
    });
}

type ReschedulableAppointment = {
    userId: string | null;
    barberId: string;
    businessId: string;
    status: AppointmentStatus;
    date: Date;
};

function assertCanReschedule(appointment: ReschedulableAppointment, actor: Actor) {
    const asCustomer = actsAsCustomer(appointment, actor);

    if (asCustomer) {
        if (appointment.userId !== actor.userId) {
            throw new AppError("Not authorized", 403);
        }
    } else {
        assertTeamAccess(appointment, actor);
    }

    if (appointment.status !== "PENDING" && appointment.status !== "CONFIRMED") {
        throw new AppError("This appointment can no longer be rescheduled");
    }

    const msUntil = appointment.date.getTime() - Date.now();

    if (msUntil <= 0) {
        throw new AppError("This appointment can no longer be rescheduled");
    }

    if (asCustomer && msUntil < CUSTOMER_CHANGE_LIMIT_MS) {
        throw new AppError("Appointments cannot be rescheduled less than 2 hours before the scheduled time");
    }
}

// Horarios a los que se puede mover la cita: libres y con espacio para su servicio
export async function getRescheduleSlots(appointmentId: string, dateKey: string, actor: Actor) {
    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: {
            id: true,
            userId: true,
            barberId: true,
            businessId: true,
            status: true,
            date: true,
            service: { select: { duration: true } },
            business: { select: { timezone: true } },
        },
    });

    if (!appointment) {
        throw new AppError("Appointment not found", 404);
    }

    assertCanReschedule(appointment, actor);

    const day = await getBarberDay(prisma, appointment.barberId, dateKey, appointment.business.timezone, {
        excludeAppointmentId: appointment.id,
    });

    return day.slots
        .filter(
            (slot) =>
                slot.maxMinutes >= appointment.service.duration &&
                slot.start.getTime() !== appointment.date.getTime()
        )
        .map((slot) => ({ start: slot.start.toISOString(), label: slot.label }));
}

export async function rescheduleAppointment(appointmentId: string, date: string, actor: Actor) {
    const startDate = new Date(date);

    return prisma.$transaction(async (tx) => {
        const lockRef = await tx.appointment.findUnique({
            where: { id: appointmentId },
            select: { barberId: true, userId: true },
        });

        if (!lockRef) {
            throw new AppError("Appointment not found", 404);
        }

        // Mismo orden de locks que createAppointment
        await lockKeys(
            tx,
            `barber:${lockRef.barberId}`,
            ...(lockRef.userId ? [`user:${lockRef.userId}`] : [])
        );

        // Se vuelve a leer con el lock tomado: pudo cancelarse o moverse mientras tanto
        const appointment = await tx.appointment.findUniqueOrThrow({
            where: { id: appointmentId },
            select: {
                id: true,
                userId: true,
                barberId: true,
                businessId: true,
                status: true,
                date: true,
                service: { select: { duration: true } },
                barber: { select: { active: true, status: true } },
                business: {
                    select: {
                        active: true,
                        timezone: true,
                        subscription: { select: { billingStatus: true } },
                        settings: { select: { isServiceActive: true } },
                    },
                },
            },
        });

        assertCanReschedule(appointment, actor);

        if (!appointment.barber.active || appointment.barber.status !== "APPROVED") {
            throw new AppError("Barber not available");
        }

        if (
            !appointment.business.active ||
            !canBusinessAcceptBookings(getBillingStatus(appointment.business.subscription))
        ) {
            throw new AppError("Business is not accepting bookings at this time");
        }

        const isCustomer = actsAsCustomer(appointment, actor);

        if (isCustomer) {
            if (appointment.business.settings && !appointment.business.settings.isServiceActive) {
                throw new AppError("Business is temporarily closed");
            }

            const businessBan = await tx.businessCustomerBan.findUnique({
                where: { businessId_userId: { businessId: appointment.businessId, userId: actor.userId } },
                select: { id: true },
            });

            if (businessBan) {
                throw new AppError("You cannot book appointments at this business", 403);
            }
        }

        const timezone = resolveTimezone(appointment.business.timezone);
        const day = await getBarberDay(tx, appointment.barberId, toDateKey(startDate, timezone), timezone, {
            excludeAppointmentId: appointment.id,
        });
        const slot = day.slots.find((s) => s.start.getTime() === startDate.getTime());

        if (!slot || appointment.service.duration > slot.maxMinutes) {
            throw new AppError("Time slot not available", 409);
        }

        return tx.appointment.update({
            where: { id: appointment.id },
            data: {
                date: startDate,
                // Si el cliente la mueve, la barbería vuelve a confirmar el nuevo horario
                ...(isCustomer ? { status: "PENDING" as const } : {}),
            },
        });
    });
}

export function assertAppointmentRange(from: string, to: string) {
    const days = (Date.parse(to) - Date.parse(from)) / (24 * 60 * 60 * 1000);

    if (days < 0 || days > MAX_RANGE_DAYS) {
        throw new AppError("Invalid date range");
    }
}

export async function getUserAppointments(userId: string) {
    // Las más recientes alcanzan para próximas e historial; la pantalla no necesita años de citas
    const appointments = await prisma.appointment.findMany({
        where: {
            userId,
        },
        orderBy: {
            date: "desc",
        },
        take: USER_APPOINTMENTS_LIMIT,
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
            service: { select: { id: true, name: true, duration: true, priceCents: true } },
            business: { select: { id: true, name: true, slug: true, phone: true, settings: { select: { reviewsEnabled: true } } } },
            review: { select: { rating: true } },
        },
    });

    return appointments.reverse();
}

// Citas de un barbero entre dos días ("YYYY-MM-DD" en la zona del negocio), ambos incluidos.
// Sin fechas devuelve el mes anterior y los dos siguientes, nunca todo el historial.
export async function getBarberAppointments(barberId: string, range?: { from?: string | null; to?: string | null }) {
    if (!barberId) {
        throw new AppError("Barber ID is required");
    }

    const barber = await prisma.barber.findUnique({
        where: { id: barberId },
        select: { business: { select: { timezone: true } } },
    });

    const timezone = resolveTimezone(barber?.business.timezone);
    const today = toDateKey(new Date(), timezone);
    const from = range?.from ?? addDaysToKey(today, -31);
    const to = range?.to ?? addDaysToKey(today, 62);

    return await prisma.appointment.findMany({
        where: {
            barberId,
            status: { not: "CANCELLED" },
            date: {
                gte: zonedToUtc(from, "00:00", timezone),
                lt: zonedToUtc(addDaysToKey(to, 1), "00:00", timezone),
            },
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
            service: { select: { id: true, name: true, duration: true, priceCents: true } },
            business: { select: { id: true, name: true, slug: true } },
        },
        orderBy: {
            date: "asc",
        },
    });
}

// Barbero dueño de la cita, owner de su negocio o administrador
function hasTeamAccess(appointment: { barberId: string; businessId: string }, actor: Actor) {
    if (actor.role === "BARBER") return Boolean(actor.barberId) && appointment.barberId === actor.barberId;
    if (actor.role === "OWNER") return Boolean(actor.businessId) && appointment.businessId === actor.businessId;

    return actor.role === "ADMIN";
}

function assertTeamAccess(appointment: { barberId: string; businessId: string }, actor: Actor) {
    if (!hasTeamAccess(appointment, actor)) {
        throw new AppError("Not authorized", 403);
    }
}

// Un dueño o barbero que reservó en otra barbería es ahí un cliente más, con sus mismas reglas
export function actsAsCustomer(
    appointment: { userId: string | null; barberId: string; businessId: string },
    actor: Actor
) {
    return actor.role === "CUSTOMER" || (appointment.userId === actor.userId && !hasTeamAccess(appointment, actor));
}

const allowedTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["CANCELLED", "NO_SHOW"],
    CANCELLED: [],
    // El cron marca COMPLETED una hora después; el barbero aún puede registrar la inasistencia
    COMPLETED: ["NO_SHOW"],
    NO_SHOW: [],
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

    if (newStatus === "NO_SHOW" && appointment.date.getTime() > Date.now()) {
        throw new AppError("A no-show can only be recorded after the appointment time");
    }

    if (actsAsCustomer(appointment, { userId, role, ...context })) {
        if (newStatus !== "CANCELLED") {
            throw new AppError("Customers can only cancel appointments");
        }

        if (appointment.userId !== userId) {
            throw new AppError("Not authorized", 403);
        }

        if (appointment.date.getTime() - Date.now() < CUSTOMER_CHANGE_LIMIT_MS) {
            throw new AppError(
                "Appointments cannot be cancelled less than 2 hours before the scheduled time"
            );
        }
    } else {
        assertTeamAccess(appointment, { userId, role, ...context });
    }

    return prisma.appointment.update({
        where: { id: appointmentId },
        data: {
            status: newStatus,
            ...(newStatus === "CANCELLED"
                ? { cancelledBy: actsAsCustomer(appointment, { userId, role, ...context }) ? ("CUSTOMER" as const) : ("BUSINESS" as const) }
                : {}),
        },
    });
}
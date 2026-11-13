import { prisma } from "@/lib/prisma";
import { PAST_DUE_GRACE_DAYS } from "@/lib/billing/status";
import { resolveTimezone, toDateKey } from "@/lib/time/zoned";
import { notifyAppointment } from "@/lib/notifications/appointments";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

// Citas confirmadas que empezaron hace más de una hora pasan a COMPLETED
export async function completePastAppointments(now = new Date()) {
    const updated = await prisma.appointment.updateMany({
        where: {
            status: "CONFIRMED",
            date: {
                lt: new Date(now.getTime() - HOUR_MS),
            },
        },
        data: {
            status: "COMPLETED",
        },
    });

    return { completed: updated.count };
}

// Citas que nadie confirmó y cuya hora ya pasó se cancelan para que no queden pendientes para siempre
export async function expireUnconfirmedAppointments(now = new Date()) {
    const updated = await prisma.appointment.updateMany({
        where: {
            status: "PENDING",
            date: {
                lt: now,
            },
        },
        data: {
            status: "CANCELLED",
            cancelledBy: "SYSTEM",
        },
    });

    return { expired: updated.count };
}

// Vencimiento de suscripciones manuales (las de Stripe / Mercado Pago las actualizará su webhook):
// ACTIVE o en prueba con periodo vencido -> PAST_DUE; PAST_DUE vencido hace más de la gracia -> SUSPENDED
export async function updateExpiredSubscriptions(now = new Date()) {
    const graceLimit = new Date(now.getTime() - PAST_DUE_GRACE_DAYS * DAY_MS);

    // Primero suspender, para que un ACTIVE recién vencido pase por PAST_DUE antes de suspenderse
    const suspended = await prisma.businessSubscription.updateMany({
        where: {
            provider: "MANUAL",
            billingStatus: "PAST_DUE",
            currentPeriodEnd: { lt: graceLimit },
        },
        data: {
            billingStatus: "SUSPENDED",
        },
    });

    const pastDue = await prisma.businessSubscription.updateMany({
        where: {
            provider: "MANUAL",
            billingStatus: { in: ["ACTIVE", "TRIALING"] },
            currentPeriodEnd: { lt: now },
        },
        data: {
            billingStatus: "PAST_DUE",
        },
    });

    return { pastDue: pastDue.count, suspended: suspended.count };
}

// Recordatorio push a los clientes con cita confirmada hoy (día de la zona de la barbería).
// Se marca antes de enviar: si el cron se repite, nadie recibe el aviso dos veces.
export async function sendDayReminders(now = new Date()) {
    const candidates = await prisma.appointment.findMany({
        where: {
            status: "CONFIRMED",
            userId: { not: null },
            reminderSentAt: null,
            date: { gt: now, lt: new Date(now.getTime() + DAY_MS) },
        },
        select: { id: true, date: true, business: { select: { timezone: true } } },
    });

    const today = candidates.filter((a) => {
        const timezone = resolveTimezone(a.business.timezone);
        return toDateKey(a.date, timezone) === toDateKey(now, timezone);
    });

    if (today.length === 0) return { reminded: 0, sent: 0 };

    await prisma.appointment.updateMany({
        where: { id: { in: today.map((a) => a.id) }, reminderSentAt: null },
        data: { reminderSentAt: now },
    });

    let sent = 0;
    for (const appointment of today) {
        sent += (await notifyAppointment(appointment.id, "reminder")).sent;
    }

    return { reminded: today.length, sent };
}

// La bandeja guarda dos meses: lo más viejo ya no le sirve a nadie
export async function purgeOldNotifications(now = new Date()) {
    const { count } = await prisma.notification.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - 60 * DAY_MS) } } });
    return { purged: count };
}

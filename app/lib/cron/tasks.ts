import { prisma } from "@/lib/prisma";
import { PAST_DUE_GRACE_DAYS } from "@/lib/billing/status";

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

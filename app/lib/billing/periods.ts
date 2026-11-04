import type { BusinessBillingStatus } from "@prisma/client";
import { PAST_DUE_GRACE_DAYS } from "@/lib/billing/status";
import { addDaysToKey, addMonthsToKey, endOfDayUtc, toDateKey, zonedToUtc } from "@/lib/time/zoned";

// Días gratis de un negocio nuevo y días de anticipación con los que se avisa del vencimiento
export const TRIAL_DAYS = 30;
export const BILLING_ALERT_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

export function trialEndsAt(now: Date, timezone: string) {
    return endOfDayUtc(addDaysToKey(toDateKey(now, timezone), TRIAL_DAYS), timezone);
}

// Un pago continúa el periodo si sigue vigente o está dentro de la gracia (los días de gracia no son gratis).
// Un negocio suspendido, cancelado o sin periodo empieza de nuevo el día de hoy.
export function computePaidPeriod(params: {
    status: BusinessBillingStatus;
    currentPeriodEnd: Date | null;
    months: number;
    now: Date;
    timezone: string;
}) {
    const { status, currentPeriodEnd, months, now, timezone } = params;

    const continues =
        (status === "ACTIVE" || status === "TRIALING" || status === "PAST_DUE") &&
        currentPeriodEnd !== null &&
        currentPeriodEnd.getTime() >= now.getTime() - PAST_DUE_GRACE_DAYS * DAY_MS;

    if (continues) {
        const previousEndKey = toDateKey(currentPeriodEnd, timezone);

        return {
            periodStart: zonedToUtc(addDaysToKey(previousEndKey, 1), "00:00", timezone),
            periodEnd: endOfDayUtc(addMonthsToKey(previousEndKey, months), timezone),
        };
    }

    const todayKey = toDateKey(now, timezone);

    return {
        periodStart: zonedToUtc(todayKey, "00:00", timezone),
        periodEnd: endOfDayUtc(addMonthsToKey(todayKey, months), timezone),
    };
}

export type BillingAlert = {
    kind: "trialEnding" | "dueSoon" | "pastDue" | "suspended" | "canceled" | "pending";
    // Días hasta el vencimiento o, si ya venció, hasta la suspensión
    days: number;
};

export function getBillingAlert(params: {
    status: BusinessBillingStatus;
    currentPeriodEnd: Date | null;
    now: Date;
}): BillingAlert | null {
    const { status, currentPeriodEnd, now } = params;

    if (status === "SUSPENDED") return { kind: "suspended", days: 0 };
    if (status === "CANCELED") return { kind: "canceled", days: 0 };
    if (status === "PENDING_PAYMENT") return { kind: "pending", days: 0 };
    if (!currentPeriodEnd) return null;

    const daysUntil = (ms: number) => Math.max(0, Math.ceil((ms - now.getTime()) / DAY_MS));
    const end = currentPeriodEnd.getTime();

    if (status === "PAST_DUE") {
        return { kind: "pastDue", days: daysUntil(end + PAST_DUE_GRACE_DAYS * DAY_MS) };
    }

    const days = daysUntil(end);

    if (days > BILLING_ALERT_DAYS) return null;

    return { kind: status === "TRIALING" ? "trialEnding" : "dueSoon", days };
}

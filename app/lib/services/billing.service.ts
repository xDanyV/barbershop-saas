import type { PaymentMethod } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computePaidPeriod } from "@/lib/billing/periods";
import { AppError } from "@/lib/errors";
import { lockKeys } from "@/lib/services/booking.service";
import { resolveTimezone, toDateKey, zonedToUtc } from "@/lib/time/zoned";

export const paymentSelect = {
    id: true,
    amountCents: true,
    currency: true,
    method: true,
    months: true,
    paidAt: true,
    periodStart: true,
    periodEnd: true,
    note: true,
    voidedAt: true,
    createdAt: true,
} as const;

// Registra un pago recibido por fuera de la plataforma y extiende la membresía
export async function recordPayment(data: {
    businessId: string;
    recordedById: string;
    amountCents: number;
    method: PaymentMethod;
    months: number;
    paidAt: string;
    note?: string | null;
}) {
    const { businessId, recordedById, amountCents, method, months, paidAt, note } = data;

    const payment = await prisma.$transaction(async (tx) => {
        await lockKeys(tx, `billing:${businessId}`);

        const business = await tx.business.findUnique({
            where: { id: businessId },
            select: { timezone: true, subscription: { select: { billingStatus: true, currentPeriodEnd: true } } },
        });

        if (!business) {
            throw new AppError("Business not found", 404);
        }

        const timezone = resolveTimezone(business.timezone);
        const now = new Date();

        if (paidAt > toDateKey(now, timezone)) {
            throw new AppError("The payment date cannot be in the future");
        }

        const previousStatus = business.subscription?.billingStatus ?? "PENDING_PAYMENT";
        const previousPeriodEnd = business.subscription?.currentPeriodEnd ?? null;
        const { periodStart, periodEnd } = computePaidPeriod({
            status: previousStatus,
            currentPeriodEnd: previousPeriodEnd,
            months,
            now,
            timezone,
        });

        const renewal = {
            billingStatus: "ACTIVE" as const,
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
            canceledAt: null,
        };

        await tx.businessSubscription.upsert({
            where: { businessId },
            update: renewal,
            create: { businessId, ...renewal },
        });

        return tx.businessPayment.create({
            data: {
                businessId,
                recordedById,
                amountCents,
                method,
                months,
                paidAt: zonedToUtc(paidAt, "12:00", timezone),
                periodStart,
                periodEnd,
                note: note || null,
                previousPeriodEnd,
                previousStatus,
            },
            select: paymentSelect,
        });
    });

    return payment;
}

// Corrige un pago capturado por error. Solo el último, para poder dejar la membresía como estaba.
export async function voidLatestPayment(businessId: string) {
    return prisma.$transaction(async (tx) => {
        await lockKeys(tx, `billing:${businessId}`);

        const latest = await tx.businessPayment.findFirst({
            where: { businessId, voidedAt: null },
            orderBy: { createdAt: "desc" },
        });

        if (!latest) {
            throw new AppError("There is no payment to void", 404);
        }

        const subscription = await tx.businessSubscription.findUnique({
            where: { businessId },
            select: { currentPeriodEnd: true },
        });

        // Si alguien ajustó la fecha a mano después del pago, restaurarla pisaría ese cambio
        if (subscription?.currentPeriodEnd?.getTime() !== latest.periodEnd.getTime()) {
            throw new AppError("The membership changed after this payment", 409);
        }

        await tx.businessSubscription.update({
            where: { businessId },
            data: {
                billingStatus: latest.previousStatus,
                currentPeriodEnd: latest.previousPeriodEnd,
                canceledAt: latest.previousStatus === "CANCELED" ? new Date() : null,
            },
        });

        return tx.businessPayment.update({
            where: { id: latest.id },
            data: { voidedAt: new Date() },
            select: paymentSelect,
        });
    });
}

export async function getBusinessPayments(businessId: string, options?: { includeVoided?: boolean }) {
    return prisma.businessPayment.findMany({
        where: { businessId, ...(options?.includeVoided ? {} : { voidedAt: null }) },
        orderBy: { createdAt: "desc" },
        select: paymentSelect,
    });
}

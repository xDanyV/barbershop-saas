import type { BusinessBillingStatus, BusinessPlanType, Prisma } from "@prisma/client";

// Días que un negocio sigue recibiendo reservas tras vencer su periodo antes de suspenderse
export const PAST_DUE_GRACE_DAYS = 7;

// Igual que el default de BusinessSubscription; un negocio sin suscripción no debería existir
const DEFAULT_BILLING_STATUS: BusinessBillingStatus = "ACTIVE";
const DEFAULT_BILLING_PLAN: BusinessPlanType = "BASIC";

export const billingSummarySelect = {
    plan: true,
    billingStatus: true,
    currentPeriodEnd: true,
} satisfies Prisma.BusinessSubscriptionSelect;

type BillingSubscription = {
    plan: BusinessPlanType;
    billingStatus: BusinessBillingStatus;
    currentPeriodEnd: Date | null;
} | null | undefined;

// Forma plana que consumen los paneles de admin y "Mi negocio"
export function toBillingSummary(subscription: BillingSubscription) {
    return {
        billingStatus: subscription?.billingStatus ?? DEFAULT_BILLING_STATUS,
        billingPlan: subscription?.plan ?? DEFAULT_BILLING_PLAN,
        subscriptionEndsAt: subscription?.currentPeriodEnd ?? null,
    };
}

export function getBillingStatus(subscription: { billingStatus: BusinessBillingStatus } | null | undefined) {
    return subscription?.billingStatus ?? DEFAULT_BILLING_STATUS;
}

// Negocios visibles en la parte pública: activos y sin suscripción suspendida o cancelada
export const publicBusinessWhere = {
    active: true,
    OR: [
        { subscription: { is: null } },
        { subscription: { is: { billingStatus: { notIn: ["SUSPENDED", "CANCELED"] } } } },
    ],
} satisfies Prisma.BusinessWhereInput;

export function canBusinessAcceptBookings(status: BusinessBillingStatus) {
    return status === "ACTIVE" || status === "PAST_DUE";
}

export function isBusinessSuspended(status: BusinessBillingStatus) {
    return status === "SUSPENDED" || status === "CANCELED";
}

export function getBillingStatusLabel(status: BusinessBillingStatus) {
    const labels: Record<BusinessBillingStatus, string> = {
        PENDING_PAYMENT: "Pago pendiente",
        ACTIVE: "Activa",
        PAST_DUE: "Pago atrasado",
        SUSPENDED: "Suspendida",
        CANCELED: "Cancelada",
    };

    return labels[status];
}

export function getBillingStatusDescription(status: BusinessBillingStatus) {
    const descriptions: Record<BusinessBillingStatus, string> = {
        PENDING_PAYMENT:
            "El negocio todavía no ha completado el pago inicial.",
        ACTIVE:
            "La suscripción está activa y el negocio puede recibir reservas.",
        PAST_DUE:
            "Hay un pago pendiente. El negocio sigue activo temporalmente.",
        SUSPENDED:
            "La suscripción está suspendida. Las reservas deben pausarse.",
        CANCELED:
            "La suscripción fue cancelada.",
    };

    return descriptions[status];
}
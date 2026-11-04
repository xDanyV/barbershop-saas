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
    return status === "ACTIVE" || status === "TRIALING" || status === "PAST_DUE";
}

export function isBusinessSuspended(status: BusinessBillingStatus) {
    return status === "SUSPENDED" || status === "CANCELED";
}

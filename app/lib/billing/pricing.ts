import type { BusinessPlanType } from "@prisma/client";

export const BILLING_PLANS = {
    FOUNDER: {
        key: "FOUNDER",
        label: "Plan Fundador",
        description: "Precio especial para los primeros negocios.",
        monthlyPriceCents: 10000,
        monthlyPriceLabel: "$100 MXN / mes",
        setupFeeCents: 0,
        setupFeeLabel: "$0 MXN",
        currency: "MXN",
        isFounderPlan: true,
    },
    BASIC: {
        key: "BASIC",
        label: "Plan Básico",
        description: "Plan mensual para negocios activos.",
        monthlyPriceCents: 15000,
        monthlyPriceLabel: "$150 MXN / mes",
        setupFeeCents: 0,
        setupFeeLabel: "$0 MXN",
        currency: "MXN",
        isFounderPlan: false,
    },
} as const satisfies Record<
    BusinessPlanType,
    {
        key: BusinessPlanType;
        label: string;
        description: string;
        monthlyPriceCents: number;
        monthlyPriceLabel: string;
        setupFeeCents: number;
        setupFeeLabel: string;
        currency: "MXN";
        isFounderPlan: boolean;
    }
>;

export function getBillingPlan(plan: BusinessPlanType) {
    return BILLING_PLANS[plan];
}

// Importes guardados en centavos (servicios y suscripciones); muestra decimales solo si los hay
export function formatPriceFromCents(cents: number, currency = "MXN") {
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency,
        minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
    }).format(cents / 100);
}
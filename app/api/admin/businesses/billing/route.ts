import { prisma } from "@/lib/prisma";
import { getBillingPlan } from "@/lib/billing/pricing";
import { toBillingSummary } from "@/lib/billing/status";
import { AppError, errorResponse } from "@/lib/errors";
import { addDaysToKey, resolveTimezone, zonedToUtc } from "@/lib/time/zoned";
import { requireAuth } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/validation";
import { updateBillingSchema } from "@/lib/validations/schemas";
import {
    Prisma,
    SubscriptionProvider,
} from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

// "YYYY-MM-DD" -> final de ese día en la zona horaria del negocio
function parseNullableEndDate(value: string | null | undefined, timezone: string) {
    if (!value) {
        return null;
    }

    return new Date(zonedToUtc(addDaysToKey(value, 1), "00:00", timezone).getTime() - 1);
}

const businessSelect = {
    id: true,
    name: true,
    slug: true,
    active: true,
    owner: {
        select: {
            id: true,
            name: true,
            email: true,
        },
    },
    subscription: {
        select: {
            id: true,
            plan: true,
            provider: true,
            billingStatus: true,
            currentPeriodEnd: true,
            monthlyPriceCents: true,
            currency: true,
        },
    },
} satisfies Prisma.BusinessSelect;

type BillingBusiness = Prisma.BusinessGetPayload<{ select: typeof businessSelect }>;

// Mantiene la forma que consume el panel (billingStatus, billingPlan, subscriptionEndsAt)
function withBillingSummary(business: BillingBusiness) {
    return {
        ...business,
        ...toBillingSummary(business.subscription),
    };
}

export async function GET(req: NextRequest) {
    try {
        requireAuth(req, ["ADMIN"]);

        const businesses = await prisma.business.findMany({
            select: businessSelect,
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(businesses.map(withBillingSummary));
    } catch (error) {
        return errorResponse(error, "Get businesses billing error");
    }
}

export async function PATCH(req: NextRequest) {
    try {
        requireAuth(req, ["ADMIN"]);
        const { businessId, billingStatus, billingPlan, subscriptionEndsAt } = await parseJsonBody(
            req,
            updateBillingSchema
        );

        const existingBusiness = await prisma.business.findUnique({
            where: {
                id: businessId,
            },
            select: {
                id: true,
                timezone: true,
            },
        });

        if (!existingBusiness) {
            throw new AppError("Business not found", 404);
        }

        const plan = getBillingPlan(billingPlan);
        const currentPeriodEnd = parseNullableEndDate(
            subscriptionEndsAt,
            resolveTimezone(existingBusiness.timezone)
        );
        const canceledAt = billingStatus === "CANCELED" ? new Date() : null;

        await prisma.businessSubscription.upsert({
            where: {
                businessId,
            },
            update: {
                plan: billingPlan,
                billingStatus,
                provider: SubscriptionProvider.MANUAL,
                setupFeeCents: plan.setupFeeCents,
                monthlyPriceCents: plan.monthlyPriceCents,
                currency: plan.currency,
                currentPeriodEnd,
                canceledAt,
            },
            create: {
                businessId,
                plan: billingPlan,
                billingStatus,
                provider: SubscriptionProvider.MANUAL,
                setupFeeCents: plan.setupFeeCents,
                monthlyPriceCents: plan.monthlyPriceCents,
                currency: plan.currency,
                currentPeriodStart: new Date(),
                currentPeriodEnd,
                canceledAt,
            },
        });

        const updatedBusiness = await prisma.business.findUniqueOrThrow({
            where: {
                id: businessId,
            },
            select: businessSelect,
        });

        return NextResponse.json(withBillingSummary(updatedBusiness));
    } catch (error) {
        return errorResponse(error, "Update business billing error");
    }
}

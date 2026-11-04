import { prisma } from "@/lib/prisma";
import { getBillingPlan } from "@/lib/billing/pricing";
import { getBillingAlert } from "@/lib/billing/periods";
import { toBillingSummary } from "@/lib/billing/status";
import { AppError, errorResponse } from "@/lib/errors";
import { revalidateBusinessPages } from "@/lib/cache/business-pages";
import { endOfDayUtc, resolveTimezone, toDateKey, zonedToUtc } from "@/lib/time/zoned";
import { requireAuth } from "@/lib/api/auth";
import { recordAudit } from "@/lib/services/audit.service";
import { parseJsonBody } from "@/lib/api/validation";
import { updateBillingSchema } from "@/lib/validations/schemas";
import {
    Prisma,
    SubscriptionProvider,
} from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const businessSelect = {
    id: true,
    name: true,
    slug: true,
    active: true,
    timezone: true,
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
    const timezone = resolveTimezone(business.timezone);
    const end = business.subscription?.currentPeriodEnd ?? null;

    return {
        ...business,
        ...toBillingSummary(business.subscription),
        // La fecha en la zona del negocio: en UTC el fin de día ya cae en el día siguiente
        subscriptionEndKey: end ? toDateKey(end, timezone) : null,
        alert: business.subscription
            ? getBillingAlert({
                status: business.subscription.billingStatus,
                currentPeriodEnd: end,
                now: new Date(),
            })
            : null,
    };
}

export async function GET(req: NextRequest) {
    try {
        requireAuth(req, ["ADMIN"]);

        const timezone = resolveTimezone();
        const monthStart = zonedToUtc(`${toDateKey(new Date(), timezone).slice(0, 7)}-01`, "00:00", timezone);

        const [businesses, collected] = await Promise.all([
            prisma.business.findMany({
                select: businessSelect,
                orderBy: {
                    createdAt: "desc",
                },
            }),
            prisma.businessPayment.aggregate({
                where: { voidedAt: null, paidAt: { gte: monthStart } },
                _sum: { amountCents: true },
            }),
        ]);

        return NextResponse.json({
            businesses: businesses.map(withBillingSummary),
            collectedThisMonthCents: collected._sum.amountCents ?? 0,
        });
    } catch (error) {
        return errorResponse(error, "Get businesses billing error");
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const { userId } = requireAuth(req, ["ADMIN"]);
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
                name: true,
                timezone: true,
            },
        });

        if (!existingBusiness) {
            throw new AppError("Business not found", 404);
        }

        const plan = getBillingPlan(billingPlan);
        const currentPeriodEnd = subscriptionEndsAt
            ? endOfDayUtc(subscriptionEndsAt, resolveTimezone(existingBusiness.timezone))
            : null;
        const canceledAt = billingStatus === "CANCELED" ? new Date() : null;

        await prisma.$transaction(async (tx) => {
            await tx.businessSubscription.upsert({
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

            await recordAudit(tx, {
                actorId: userId,
                action: "membership_adjusted",
                targetType: "business",
                targetId: businessId,
                targetLabel: existingBusiness.name,
                metadata: { status: billingStatus, plan: billingPlan, ends: subscriptionEndsAt || null },
            });
        });

        await revalidateBusinessPages(businessId);

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

import { prisma } from "@/lib/prisma";
import { getBillingPlan } from "@/lib/billing/pricing";
import { toBillingSummary } from "@/lib/billing/status";
import { AppError, errorResponse } from "@/lib/errors";
import { addDaysToKey, isValidDateKey, resolveTimezone, zonedToUtc } from "@/lib/time/zoned";
import {
    BusinessBillingStatus,
    BusinessPlanType,
    Prisma,
    SubscriptionProvider,
} from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const allowedBillingStatuses = [
    "PENDING_PAYMENT",
    "ACTIVE",
    "PAST_DUE",
    "SUSPENDED",
    "CANCELED",
] as const;

const allowedBillingPlans = ["FOUNDER", "BASIC"] as const;

function isBillingStatus(value: unknown): value is BusinessBillingStatus {
    return (
        typeof value === "string" &&
        allowedBillingStatuses.includes(value as BusinessBillingStatus)
    );
}

function isBillingPlan(value: unknown): value is BusinessPlanType {
    return (
        typeof value === "string" &&
        allowedBillingPlans.includes(value as BusinessPlanType)
    );
}

// "YYYY-MM-DD" -> final de ese día en la zona horaria del negocio
function parseNullableEndDate(value: unknown, timezone: string) {
    if (value === null || value === undefined || value === "") {
        return null;
    }

    if (!isValidDateKey(value)) {
        throw new AppError("Invalid subscription end date");
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
        const role = req.headers.get("x-user-role");

        if (role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

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
        const role = req.headers.get("x-user-role");

        if (role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();

        const businessId =
            typeof body.businessId === "string" ? body.businessId : "";

        if (!businessId) {
            return NextResponse.json(
                { error: "Business ID is required" },
                { status: 400 }
            );
        }

        if (!isBillingStatus(body.billingStatus)) {
            return NextResponse.json(
                { error: "Invalid billing status" },
                { status: 400 }
            );
        }

        if (!isBillingPlan(body.billingPlan)) {
            return NextResponse.json(
                { error: "Invalid billing plan" },
                { status: 400 }
            );
        }

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
            return NextResponse.json(
                { error: "Business not found" },
                { status: 404 }
            );
        }

        const billingStatus: BusinessBillingStatus = body.billingStatus;
        const billingPlan: BusinessPlanType = body.billingPlan;
        const plan = getBillingPlan(billingPlan);
        const currentPeriodEnd = parseNullableEndDate(
            body.subscriptionEndsAt,
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

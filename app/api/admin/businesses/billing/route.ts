import { prisma } from "@/lib/prisma";
import { getBillingPlan } from "@/lib/billing/pricing";
import {
    BusinessBillingStatus,
    BusinessPlanType,
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

function parseNullableDate(value: unknown) {
    if (value === null || value === undefined || value === "") {
        return null;
    }

    if (typeof value !== "string") {
        throw new Error("Invalid subscription end date");
    }

    const date = new Date(`${value}T23:59:59.999`);

    if (Number.isNaN(date.getTime())) {
        throw new Error("Invalid subscription end date");
    }

    return date;
}

const businessSelect = {
    id: true,
    name: true,
    slug: true,
    active: true,
    billingStatus: true,
    billingPlan: true,
    subscriptionEndsAt: true,
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
            provider: true,
            billingStatus: true,
            currentPeriodEnd: true,
            monthlyPriceCents: true,
            currency: true,
        },
    },
};

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

        return NextResponse.json(businesses);
    } catch (error) {
        console.error("Get businesses billing error:", error);

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
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

        const subscriptionEndsAt = parseNullableDate(body.subscriptionEndsAt);
        const plan = getBillingPlan(body.billingPlan);

        const existingBusiness = await prisma.business.findUnique({
            where: {
                id: businessId,
            },
            select: {
                id: true,
            },
        });

        if (!existingBusiness) {
            return NextResponse.json(
                { error: "Business not found" },
                { status: 404 }
            );
        }

        const updatedBusiness = await prisma.$transaction(async (tx) => {
            await tx.business.update({
                where: {
                    id: businessId,
                },
                data: {
                    billingStatus: body.billingStatus,
                    billingPlan: body.billingPlan,
                    subscriptionEndsAt,
                },
            });

            await tx.businessSubscription.upsert({
                where: {
                    businessId,
                },
                update: {
                    plan: body.billingPlan,
                    billingStatus: body.billingStatus,
                    provider: SubscriptionProvider.MANUAL,
                    setupFeeCents: plan.setupFeeCents,
                    monthlyPriceCents: plan.monthlyPriceCents,
                    currency: plan.currency,
                    currentPeriodEnd: subscriptionEndsAt,
                },
                create: {
                    businessId,
                    plan: body.billingPlan,
                    billingStatus: body.billingStatus,
                    provider: SubscriptionProvider.MANUAL,
                    setupFeeCents: plan.setupFeeCents,
                    monthlyPriceCents: plan.monthlyPriceCents,
                    currency: plan.currency,
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: subscriptionEndsAt,
                },
            });

            return tx.business.findUnique({
                where: {
                    id: businessId,
                },
                select: businessSelect,
            });
        });

        return NextResponse.json(updatedBusiness);
    } catch (error) {
        console.error("Update business billing error:", error);

        const message =
            error instanceof Error ? error.message : "Internal server error";

        return NextResponse.json({ error: message }, { status: 500 });
    }
}
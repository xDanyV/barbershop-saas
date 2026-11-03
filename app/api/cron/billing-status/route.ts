import { prisma } from "@/lib/prisma";
import { PAST_DUE_GRACE_DAYS } from "@/lib/billing/status";
import { NextResponse } from "next/server";

// Vencimiento de suscripciones manuales (las de Stripe / Mercado Pago las actualizará su webhook):
// ACTIVE con periodo vencido -> PAST_DUE; PAST_DUE vencido hace más de la gracia -> SUSPENDED
export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const graceLimit = new Date(now.getTime() - PAST_DUE_GRACE_DAYS * 24 * 60 * 60 * 1000);

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
            billingStatus: "ACTIVE",
            currentPeriodEnd: { lt: now },
        },
        data: {
            billingStatus: "PAST_DUE",
        },
    });

    return NextResponse.json({
        pastDue: pastDue.count,
        suspended: suspended.count,
    });
}

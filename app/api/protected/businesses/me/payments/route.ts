import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/errors";
import { requireOwnerAuth } from "@/lib/api/auth";
import { getBusinessPayments } from "@/lib/services/billing.service";

// Historial de pagos del negocio activo del dueño y cómo pagar
export async function GET(request: NextRequest) {
    try {
        const { businessId } = requireOwnerAuth(request);

        const [payments, settings] = await Promise.all([
            getBusinessPayments(businessId),
            prisma.systemSettings.findUnique({
                where: { id: "global" },
                select: { paymentInstructions: true },
            }),
        ]);

        return NextResponse.json({
            payments,
            instructions: settings?.paymentInstructions ?? null,
        });
    } catch (error) {
        return errorResponse(error, "Get owner payments error");
    }
}

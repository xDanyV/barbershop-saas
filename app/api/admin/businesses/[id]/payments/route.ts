import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/validation";
import { revalidateBusinessPages } from "@/lib/cache/business-pages";
import { getBusinessPayments, recordPayment, voidLatestPayment } from "@/lib/services/billing.service";
import { recordPaymentSchema } from "@/lib/validations/schemas";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
    try {
        requireAuth(request, ["ADMIN"]);
        const { id } = await context.params;

        return NextResponse.json(await getBusinessPayments(id, { includeVoided: true }));
    } catch (error) {
        return errorResponse(error, "Get business payments error");
    }
}

export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const { userId } = requireAuth(request, ["ADMIN"]);
        const { id } = await context.params;
        const body = await parseJsonBody(request, recordPaymentSchema);

        const payment = await recordPayment({ businessId: id, recordedById: userId, ...body });

        // Un negocio suspendido vuelve a mostrarse en público
        await revalidateBusinessPages(id);

        return NextResponse.json(payment, { status: 201 });
    } catch (error) {
        return errorResponse(error, "Record business payment error");
    }
}

// Anula el último pago y deja la membresía como estaba
export async function DELETE(request: NextRequest, context: RouteContext) {
    try {
        requireAuth(request, ["ADMIN"]);
        const { id } = await context.params;

        const payment = await voidLatestPayment(id);

        await revalidateBusinessPages(id);

        return NextResponse.json(payment);
    } catch (error) {
        return errorResponse(error, "Void business payment error");
    }
}

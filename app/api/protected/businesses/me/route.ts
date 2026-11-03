import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { billingSummarySelect, toBillingSummary } from "@/lib/billing/status";
import { errorResponse } from "@/lib/errors";
import { revalidateBusinessPages } from "@/lib/cache/business-pages";
import { requireOwnerAuth } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/validation";
import { updateBusinessSchema } from "@/lib/validations/schemas";

// x-business-id de un OWNER siempre es uno de sus negocios (lo valida la sesión en el proxy)
async function getBusinessWithSettings(businessId: string) {
    const business = await prisma.business.findUniqueOrThrow({
        where: { id: businessId },
        include: {
            settings: true,
            subscription: { select: billingSummarySelect },
        },
    });

    return { ...business, ...toBillingSummary(business.subscription) };
}

export async function GET(req: NextRequest) {
    try {
        const { businessId } = requireOwnerAuth(req);

        return NextResponse.json(await getBusinessWithSettings(businessId));
    } catch (error) {
        return errorResponse(error, "Get owner business error");
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const { businessId } = requireOwnerAuth(req);
        const { isServiceActive, maintenanceMessage, ...profile } = await parseJsonBody(
            req,
            updateBusinessSchema
        );

        await prisma.$transaction([
            prisma.business.update({
                where: { id: businessId },
                data: profile,
            }),
            // undefined deja el valor actual intacto
            prisma.businessSettings.upsert({
                where: { businessId },
                update: { isServiceActive, maintenanceMessage },
                create: { businessId, isServiceActive, maintenanceMessage },
            }),
        ]);

        await revalidateBusinessPages(businessId);

        return NextResponse.json(await getBusinessWithSettings(businessId));
    } catch (error) {
        return errorResponse(error, "Update owner business error");
    }
}

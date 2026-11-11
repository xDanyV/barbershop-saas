import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { billingSummarySelect, toBillingSummary } from "@/lib/billing/status";
import { errorResponse } from "@/lib/errors";
import { cleanUpUploads } from "@/lib/uploads";
import { replacedUrls } from "@/lib/upload-keys";
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
        const { isServiceActive, autoConfirm, maintenanceMessage, ...profile } = await parseJsonBody(
            req,
            updateBusinessSchema
        );

        const before = await prisma.business.findUniqueOrThrow({
            where: { id: businessId },
            select: { logoUrl: true, coverUrl: true },
        });

        await prisma.$transaction([
            prisma.business.update({
                where: { id: businessId },
                data: profile,
            }),
            // undefined deja el valor actual intacto
            prisma.businessSettings.upsert({
                where: { businessId },
                update: { isServiceActive, autoConfirm, maintenanceMessage },
                create: { businessId, isServiceActive, autoConfirm, maintenanceMessage },
            }),
        ]);

        await revalidateBusinessPages(businessId);
        // El logo o la portada anteriores ya no se usan
        cleanUpUploads(replacedUrls([[before.logoUrl, profile.logoUrl], [before.coverUrl, profile.coverUrl]]));

        return NextResponse.json(await getBusinessWithSettings(businessId));
    } catch (error) {
        return errorResponse(error, "Update owner business error");
    }
}

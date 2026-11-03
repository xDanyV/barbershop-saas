import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { requireOwnerAuth } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/validation";
import { galleryItemSchema } from "@/lib/validations/schemas";
import { assertGalleryItem } from "@/lib/services/business-content.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
    try {
        const { businessId } = requireOwnerAuth(req);
        const { id } = await context.params;
        const data = await parseJsonBody(req, galleryItemSchema);

        await assertGalleryItem(id, businessId);

        const updatedItem = await prisma.businessGallery.update({
            where: { id },
            data,
        });

        return NextResponse.json(updatedItem);
    } catch (error) {
        return errorResponse(error, "Update business gallery item error");
    }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
    try {
        const { businessId } = requireOwnerAuth(req);
        const { id } = await context.params;

        await assertGalleryItem(id, businessId);

        await prisma.businessGallery.update({
            where: { id },
            data: { active: false },
        });

        return NextResponse.json({ message: "Gallery item deleted successfully" });
    } catch (error) {
        return errorResponse(error, "Delete business gallery item error");
    }
}

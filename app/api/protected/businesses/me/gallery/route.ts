import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { requireOwnerAuth } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/validation";
import { galleryItemSchema } from "@/lib/validations/schemas";

export async function GET(req: NextRequest) {
    try {
        const { businessId } = requireOwnerAuth(req);

        const gallery = await prisma.businessGallery.findMany({
            where: {
                businessId,
                active: true,
            },
            orderBy: [
                { position: "asc" },
                { createdAt: "desc" },
            ],
        });

        return NextResponse.json(gallery);
    } catch (error) {
        return errorResponse(error, "Get business gallery error");
    }
}

export async function POST(req: NextRequest) {
    try {
        const { businessId } = requireOwnerAuth(req);
        const data = await parseJsonBody(req, galleryItemSchema);

        const item = await prisma.businessGallery.create({
            data: { businessId, ...data },
        });

        return NextResponse.json(item, { status: 201 });
    } catch (error) {
        return errorResponse(error, "Create business gallery item error");
    }
}

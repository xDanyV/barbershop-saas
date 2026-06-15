import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

async function getOwnerBusiness(userId: string, businessId?: string | null) {
    return prisma.business.findFirst({
        where: {
            ownerId: userId,
            ...(businessId ? { id: businessId } : {}),
        },
        select: {
            id: true,
        },
    });
}

export async function PATCH(req: NextRequest, context: RouteContext) {
    try {
        const userId = req.headers.get("x-user-id");
        const role = req.headers.get("x-user-role");
        const businessId = req.headers.get("x-business-id");

        if (!userId || role !== "OWNER") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const business = await getOwnerBusiness(userId, businessId);

        if (!business) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        const { id } = await context.params;
        const body = await req.json();

        const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
        const caption =
            typeof body.caption === "string" && body.caption.trim().length > 0
                ? body.caption.trim()
                : null;

        const position =
            typeof body.position === "number" && Number.isFinite(body.position)
                ? body.position
                : 0;

        if (!imageUrl) {
            return NextResponse.json(
                { error: "Image URL is required" },
                { status: 400 }
            );
        }

        const existingItem = await prisma.businessGallery.findFirst({
            where: {
                id,
                businessId: business.id,
            },
        });

        if (!existingItem) {
            return NextResponse.json({ error: "Gallery item not found" }, { status: 404 });
        }

        const updatedItem = await prisma.businessGallery.update({
            where: { id },
            data: {
                imageUrl,
                caption,
                position,
            },
        });

        return NextResponse.json(updatedItem);
    } catch (error) {
        console.error("Update business gallery item error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
    try {
        const userId = req.headers.get("x-user-id");
        const role = req.headers.get("x-user-role");
        const businessId = req.headers.get("x-business-id");

        if (!userId || role !== "OWNER") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const business = await getOwnerBusiness(userId, businessId);

        if (!business) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        const { id } = await context.params;

        const existingItem = await prisma.businessGallery.findFirst({
            where: {
                id,
                businessId: business.id,
            },
        });

        if (!existingItem) {
            return NextResponse.json({ error: "Gallery item not found" }, { status: 404 });
        }

        await prisma.businessGallery.update({
            where: { id },
            data: {
                active: false,
            },
        });

        return NextResponse.json({ message: "Gallery item deleted successfully" });
    } catch (error) {
        console.error("Delete business gallery item error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
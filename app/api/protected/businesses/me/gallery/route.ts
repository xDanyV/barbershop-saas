import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

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

export async function GET(req: NextRequest) {
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

        const gallery = await prisma.businessGallery.findMany({
            where: {
                businessId: business.id,
                active: true,
            },
            orderBy: [
                { position: "asc" },
                { createdAt: "desc" },
            ],
        });

        return NextResponse.json(gallery);
    } catch (error) {
        console.error("Get business gallery error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
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

        const item = await prisma.businessGallery.create({
            data: {
                businessId: business.id,
                imageUrl,
                caption,
                position,
            },
        });

        return NextResponse.json(item, { status: 201 });
    } catch (error) {
        console.error("Create business gallery item error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
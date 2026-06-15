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

        const posts = await prisma.businessPost.findMany({
            where: {
                businessId: business.id,
                active: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(posts);
    } catch (error) {
        console.error("Get business posts error:", error);
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
        const content = typeof body.content === "string" ? body.content.trim() : "";
        const imageUrl =
            typeof body.imageUrl === "string" && body.imageUrl.trim().length > 0
                ? body.imageUrl.trim()
                : null;

        if (!content || content.length < 3) {
            return NextResponse.json(
                { error: "Post content must be at least 3 characters long" },
                { status: 400 }
            );
        }

        const post = await prisma.businessPost.create({
            data: {
                businessId: business.id,
                content,
                imageUrl,
            },
        });

        return NextResponse.json(post, { status: 201 });
    } catch (error) {
        console.error("Create business post error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
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

        const existingPost = await prisma.businessPost.findFirst({
            where: {
                id,
                businessId: business.id,
            },
        });

        if (!existingPost) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        const updatedPost = await prisma.businessPost.update({
            where: { id },
            data: {
                content,
                imageUrl,
            },
        });

        return NextResponse.json(updatedPost);
    } catch (error) {
        console.error("Update business post error:", error);
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

        const existingPost = await prisma.businessPost.findFirst({
            where: {
                id,
                businessId: business.id,
            },
        });

        if (!existingPost) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        await prisma.businessPost.update({
            where: { id },
            data: {
                active: false,
            },
        });

        return NextResponse.json({ message: "Post deleted successfully" });
    } catch (error) {
        console.error("Delete business post error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
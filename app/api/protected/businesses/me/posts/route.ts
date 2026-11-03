import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { requireOwnerAuth } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/validation";
import { businessPostSchema } from "@/lib/validations/schemas";

export async function GET(req: NextRequest) {
    try {
        const { businessId } = requireOwnerAuth(req);

        const posts = await prisma.businessPost.findMany({
            where: {
                businessId,
                active: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(posts);
    } catch (error) {
        return errorResponse(error, "Get business posts error");
    }
}

export async function POST(req: NextRequest) {
    try {
        const { businessId } = requireOwnerAuth(req);
        const data = await parseJsonBody(req, businessPostSchema);

        const post = await prisma.businessPost.create({
            data: { businessId, ...data },
        });

        return NextResponse.json(post, { status: 201 });
    } catch (error) {
        return errorResponse(error, "Create business post error");
    }
}

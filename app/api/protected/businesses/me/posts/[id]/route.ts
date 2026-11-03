import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { requireOwnerAuth } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/validation";
import { businessPostSchema } from "@/lib/validations/schemas";
import { assertBusinessPost } from "@/lib/services/business-content.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
    try {
        const { businessId } = requireOwnerAuth(req);
        const { id } = await context.params;
        const data = await parseJsonBody(req, businessPostSchema);

        await assertBusinessPost(id, businessId);

        const updatedPost = await prisma.businessPost.update({
            where: { id },
            data,
        });

        return NextResponse.json(updatedPost);
    } catch (error) {
        return errorResponse(error, "Update business post error");
    }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
    try {
        const { businessId } = requireOwnerAuth(req);
        const { id } = await context.params;

        await assertBusinessPost(id, businessId);

        await prisma.businessPost.update({
            where: { id },
            data: { active: false },
        });

        return NextResponse.json({ message: "Post deleted successfully" });
    } catch (error) {
        return errorResponse(error, "Delete business post error");
    }
}

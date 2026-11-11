import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { cleanUpUploads } from "@/lib/uploads";
import { replacedUrls } from "@/lib/upload-keys";
import { revalidateBusinessPages } from "@/lib/cache/business-pages";
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

        const current = await assertBusinessPost(id, businessId);

        const updatedPost = await prisma.businessPost.update({
            where: { id },
            data,
        });

        await revalidateBusinessPages(businessId);
        cleanUpUploads(replacedUrls([[current.imageUrl, data.imageUrl]]));

        return NextResponse.json(updatedPost);
    } catch (error) {
        return errorResponse(error, "Update business post error");
    }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
    try {
        const { businessId } = requireOwnerAuth(req);
        const { id } = await context.params;

        const current = await assertBusinessPost(id, businessId);

        await prisma.businessPost.update({
            where: { id },
            data: { active: false },
        });

        await revalidateBusinessPages(businessId);
        cleanUpUploads([current.imageUrl]);

        return NextResponse.json({ message: "Post deleted successfully" });
    } catch (error) {
        return errorResponse(error, "Delete business post error");
    }
}

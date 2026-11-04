import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AppError, errorResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/validation";
import { revalidateBusinessPages } from "@/lib/cache/business-pages";
import { recordAudit } from "@/lib/services/audit.service";
import { updateBusinessActiveSchema } from "@/lib/validations/schemas";

type RouteContext = { params: Promise<{ id: string }> };

// Desactivar oculta la página pública y detiene las reservas; no toca la membresía ni las citas ya agendadas
export async function PATCH(request: NextRequest, context: RouteContext) {
    try {
        const { userId } = requireAuth(request, ["ADMIN"]);
        const { id } = await context.params;
        const { active, reason } = await parseJsonBody(request, updateBusinessActiveSchema);

        const business = await prisma.$transaction(async (tx) => {
            const existing = await tx.business.findUnique({
                where: { id },
                select: { name: true, active: true },
            });

            if (!existing) {
                throw new AppError("Business not found", 404);
            }

            const updated = await tx.business.update({
                where: { id },
                data: { active },
                select: { id: true, active: true },
            });

            if (existing.active !== active) {
                await recordAudit(tx, {
                    actorId: userId,
                    action: active ? "business_activated" : "business_deactivated",
                    targetType: "business",
                    targetId: id,
                    targetLabel: existing.name,
                    metadata: reason ? { reason } : undefined,
                });
            }

            return updated;
        });

        await revalidateBusinessPages(id);

        return NextResponse.json(business);
    } catch (error) {
        return errorResponse(error, "Update business active error");
    }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AppError, errorResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/validation";
import { resetLinkForEmailSchema } from "@/lib/validations/schemas";
import { recordAudit } from "@/lib/services/audit.service";
import { createPasswordResetToken } from "@/lib/auth/password-reset";

// Antes de compartirlo, confirma por otro medio que quien lo pide es dueño de la cuenta
export async function POST(req: NextRequest) {
    try {
        const { userId } = requireAuth(req, ["ADMIN"]);
        const { email } = await parseJsonBody(req, resetLinkForEmailSchema);

        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, name: true, phone: true, role: true, deletedAt: true },
        });

        if (!user || user.deletedAt) throw new AppError("No account uses that email.", 404, "ACCOUNT_NOT_FOUND");
        if (user.id === userId) throw new AppError("Change your own password from your account.", 403);

        const { token, expiresAt } = await createPasswordResetToken(user.id, userId);

        await recordAudit(prisma, {
            actorId: userId,
            action: "password_reset_link_created",
            targetType: "user",
            targetId: user.id,
        });

        return NextResponse.json({ token, expiresAt, name: user.name, phone: user.phone });
    } catch (error) {
        return errorResponse(error, "Create reset link error");
    }
}

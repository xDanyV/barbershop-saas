import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AppError, errorResponse } from "@/lib/errors";
import { requireOwnerAuth } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/validation";
import { resetLinkForBarberSchema } from "@/lib/validations/schemas";
import { recordAudit } from "@/lib/services/audit.service";
import { createPasswordResetToken } from "@/lib/auth/password-reset";

// Solo para barberos de su barbería; su propia contraseña la cambia desde Mi cuenta
export async function POST(req: NextRequest) {
    try {
        const { userId, businessId } = requireOwnerAuth(req);
        const { barberId } = await parseJsonBody(req, resetLinkForBarberSchema);

        const barber = await prisma.barber.findFirst({
            where: { id: barberId, businessId },
            select: { userId: true, user: { select: { name: true, role: true, deletedAt: true } } },
        });

        if (!barber || barber.user.deletedAt) throw new AppError("Barber not found", 404);
        if (barber.userId === userId || barber.user.role !== "BARBER") throw new AppError("Forbidden", 403);

        const { token, expiresAt } = await createPasswordResetToken(barber.userId, userId);

        await recordAudit(prisma, {
            actorId: userId,
            action: "password_reset_link_created",
            targetType: "user",
            targetId: barber.userId,
        });

        return NextResponse.json({ token, expiresAt });
    } catch (error) {
        return errorResponse(error, "Create barber reset link error");
    }
}

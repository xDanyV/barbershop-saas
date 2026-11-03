import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { AppError, errorResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/validation";
import { changePasswordSchema } from "@/lib/validations/schemas";
import { RATE_LIMITS, consumeRateLimit } from "@/lib/rate-limit";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, sessionCookieOptions, signSessionToken } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
    try {
        const { userId } = requireAuth(request);
        await consumeRateLimit(`password:user:${userId}`, RATE_LIMITS.passwordUser);
        const { currentPassword, newPassword } = await parseJsonBody(request, changePasswordSchema);

        const user = await prisma.user.findUniqueOrThrow({
            where: { id: userId },
            select: { password: true },
        });

        if (!(await bcrypt.compare(currentPassword, user.password))) {
            throw new AppError("Your current password is not correct.", 403);
        }

        // Subir la versión invalida las sesiones abiertas en otros dispositivos
        const updated = await prisma.user.update({
            where: { id: userId },
            data: { password: await bcrypt.hash(newPassword, 10), sessionVersion: { increment: 1 } },
            select: { sessionVersion: true },
        });

        // Este navegador sigue con sesión: se le entrega un token con la versión nueva
        const response = NextResponse.json({ updated: true });
        response.cookies.set(SESSION_COOKIE, await signSessionToken(userId, updated.sessionVersion), {
            ...sessionCookieOptions,
            maxAge: SESSION_MAX_AGE_SECONDS,
        });

        return response;
    } catch (error) {
        return errorResponse(error, "Change password error");
    }
}

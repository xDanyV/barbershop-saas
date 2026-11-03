import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/api/auth";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, sessionCookieOptions, signSessionToken } from "@/lib/auth/session";

// Cierra la sesión en todos los demás dispositivos; este navegador sigue dentro con un token nuevo
export async function DELETE(request: NextRequest) {
    try {
        const { userId } = requireAuth(request);

        const updated = await prisma.user.update({
            where: { id: userId },
            data: { sessionVersion: { increment: 1 } },
            select: { sessionVersion: true },
        });

        const response = NextResponse.json({ revoked: true });
        response.cookies.set(SESSION_COOKIE, await signSessionToken(userId, updated.sessionVersion), {
            ...sessionCookieOptions,
            maxAge: SESSION_MAX_AGE_SECONDS,
        });

        return response;
    } catch (error) {
        return errorResponse(error, "Revoke sessions error");
    }
}

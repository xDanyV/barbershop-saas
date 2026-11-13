import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/api/auth";
import { getHomePathForRole } from "@/lib/auth/session";

// Quién tiene la sesión abierta: para que las pantallas públicas ofrezcan volver al panel
export async function GET(request: NextRequest) {
    try {
        const { userId, role } = requireAuth(request);
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });

        return NextResponse.json({ name: user?.name ?? null, role, homePath: getHomePathForRole(role) });
    } catch (error) {
        return errorResponse(error, "Get session error");
    }
}

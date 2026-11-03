import { SignJWT, jwtVerify } from "jose";
import type { BarberStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "token";
// Negocio activo de un OWNER con varios negocios
export const ACTIVE_BUSINESS_COOKIE = "activeBusinessId";

const SESSION_MAX_AGE = 60 * 60 * 24; // 1 día

// sameSite "lax" para que la sesión llegue al abrir enlaces externos (QR, WhatsApp)
export const sessionCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
};

export type SessionIdentity = {
    userId: string;
    role: Role;
    isBanned: boolean;
    barberId: string | null;
    barberStatus: BarberStatus | null;
    businessId: string | null;
};

function getSecret() {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        throw new Error("JWT_SECRET not defined");
    }

    return new TextEncoder().encode(jwtSecret);
}

// El token solo identifica al usuario; rol, estado y negocio se leen de la base en cada petición
export async function signSessionToken(userId: string) {
    return new SignJWT({ userId })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(`${SESSION_MAX_AGE}s`)
        .sign(getSecret());
}

export async function verifySessionToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, getSecret());
        return typeof payload.userId === "string" ? payload.userId : null;
    } catch {
        return null;
    }
}

export async function loadSessionIdentity(
    userId: string,
    activeBusinessId?: string | null
): Promise<SessionIdentity | null> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            role: true,
            isBanned: true,
            barberProfile: {
                select: {
                    id: true,
                    status: true,
                    businessId: true,
                },
            },
            ownedBusinesses: {
                select: { id: true },
                orderBy: { createdAt: "asc" },
            },
        },
    });

    if (!user) return null;

    let businessId = user.barberProfile?.businessId ?? null;

    if (user.role === "OWNER") {
        const ownedIds = user.ownedBusinesses.map((b) => b.id);

        if (activeBusinessId && ownedIds.includes(activeBusinessId)) {
            businessId = activeBusinessId;
        } else if (!businessId || !ownedIds.includes(businessId)) {
            businessId = ownedIds[0] ?? null;
        }
    }

    return {
        userId: user.id,
        role: user.role,
        isBanned: user.isBanned,
        barberId: user.barberProfile?.id ?? null,
        barberStatus: user.barberProfile?.status ?? null,
        businessId,
    };
}

export async function getSessionFromToken(
    token: string | undefined,
    activeBusinessId?: string | null
) {
    if (!token) return null;

    const userId = await verifySessionToken(token);
    if (!userId) return null;

    return loadSessionIdentity(userId, activeBusinessId);
}

export function getHomePathForRole(role: Role) {
    if (role === "OWNER" || role === "ADMIN") return "/dashboard/admin";
    if (role === "BARBER") return "/dashboard/barber";
    return "/dashboard/customer/home";
}

export const SESSION_MAX_AGE_SECONDS = SESSION_MAX_AGE;

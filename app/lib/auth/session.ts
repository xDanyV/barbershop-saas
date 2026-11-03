import { SignJWT, jwtVerify } from "jose";
import type { BarberStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { TERMS_VERSION } from "@/lib/legal";

export const SESSION_COOKIE = "token";
// Negocio activo de un OWNER con varios negocios
export const ACTIVE_BUSINESS_COOKIE = "activeBusinessId";
// Barbero del equipo que el OWNER está gestionando (agenda, servicios, excepciones)
export const MANAGED_BARBER_COOKIE = "managedBarberId";

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
    // true cuando barberId es otro barbero del equipo y no el perfil propio del OWNER
    isManagingTeamBarber: boolean;
    // false si aún no aceptó la versión vigente de los Términos y el Aviso de Privacidad
    hasAcceptedTerms: boolean;
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
    activeBusinessId?: string | null,
    managedBarberId?: string | null
): Promise<SessionIdentity | null> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            role: true,
            isBanned: true,
            termsVersion: true,
            deletedAt: true,
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

    // Una cuenta eliminada no tiene sesión aunque el token siga vigente
    if (!user || user.deletedAt) return null;

    let businessId = user.barberProfile?.businessId ?? null;

    if (user.role === "OWNER") {
        const ownedIds = user.ownedBusinesses.map((b) => b.id);

        if (activeBusinessId && ownedIds.includes(activeBusinessId)) {
            businessId = activeBusinessId;
        } else if (!businessId || !ownedIds.includes(businessId)) {
            businessId = ownedIds[0] ?? null;
        }
    }

    let barberId = user.barberProfile?.id ?? null;
    let barberStatus = user.barberProfile?.status ?? null;
    let isManagingTeamBarber = false;

    // Un OWNER puede actuar como cualquier barbero aprobado y activo de su negocio activo.
    // Así las APIs de agenda, catálogo y excepciones (que usan x-barber-id) sirven para todo el equipo.
    if (user.role === "OWNER" && businessId && managedBarberId && managedBarberId !== barberId) {
        const teamBarber = await prisma.barber.findFirst({
            where: {
                id: managedBarberId,
                businessId,
                status: "APPROVED",
                active: true,
            },
            select: { id: true, status: true },
        });

        if (teamBarber) {
            barberId = teamBarber.id;
            barberStatus = teamBarber.status;
            isManagingTeamBarber = true;
        }
    }

    return {
        userId: user.id,
        role: user.role,
        isBanned: user.isBanned,
        hasAcceptedTerms: user.termsVersion === TERMS_VERSION,
        barberId,
        barberStatus,
        businessId,
        isManagingTeamBarber,
    };
}

export async function getSessionFromToken(
    token: string | undefined,
    activeBusinessId?: string | null,
    managedBarberId?: string | null
) {
    if (!token) return null;

    const userId = await verifySessionToken(token);
    if (!userId) return null;

    return loadSessionIdentity(userId, activeBusinessId, managedBarberId);
}

export function getHomePathForRole(role: Role) {
    if (role === "OWNER" || role === "ADMIN") return "/dashboard/admin";
    if (role === "BARBER") return "/dashboard/barber";
    return "/dashboard/customer/home";
}

export const SESSION_MAX_AGE_SECONDS = SESSION_MAX_AGE;

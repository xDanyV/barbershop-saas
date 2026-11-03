import type { Role } from "@prisma/client";
import { AppError } from "@/lib/errors";

// Identidad que el proxy define en cada petición protegida a partir de la sesión (leída de la base)
export type RequestAuth = {
    userId: string;
    role: Role;
    barberId: string | null;
    barberStatus: string | null;
    businessId: string | null;
    isBanned: boolean;
    isManagingTeamBarber: boolean;
};

export function getRequestAuth(source: Request | Headers): RequestAuth | null {
    const headers = source instanceof Headers ? source : source.headers;

    const userId = headers.get("x-user-id");
    const role = headers.get("x-user-role") as Role | null;

    if (!userId || !role) return null;

    return {
        userId,
        role,
        barberId: headers.get("x-barber-id"),
        barberStatus: headers.get("x-barber-status"),
        businessId: headers.get("x-business-id"),
        isBanned: headers.get("x-user-banned") === "true",
        isManagingTeamBarber: headers.get("x-managing-team-barber") === "true",
    };
}

// Lanza 401 sin sesión y 403 si el rol no está permitido
export function requireAuth(source: Request | Headers, roles?: Role[]): RequestAuth {
    const auth = getRequestAuth(source);

    if (!auth) {
        throw new AppError("Unauthorized", 401);
    }

    if (roles && !roles.includes(auth.role)) {
        throw new AppError("Forbidden", 403);
    }

    return auth;
}

// Para rutas que actúan sobre un perfil de barbero (agenda, catálogo, excepciones)
export function requireBarberAuth(source: Request | Headers) {
    const auth = requireAuth(source, ["BARBER", "OWNER", "ADMIN"]);

    if (!auth.barberId) {
        throw new AppError("Forbidden", 403);
    }

    return { ...auth, barberId: auth.barberId };
}

// Para rutas del OWNER sobre su negocio activo
export function requireOwnerAuth(source: Request | Headers) {
    const auth = requireAuth(source, ["OWNER"]);

    if (!auth.businessId) {
        throw new AppError("Business context is required", 403);
    }

    return { ...auth, businessId: auth.businessId };
}

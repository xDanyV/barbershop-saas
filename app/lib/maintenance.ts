import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Modo "próximamente": mientras MAINTENANCE_MODE=true, todo el tráfico ve /[locale]/coming-soon.
// Quien abre cualquier URL con ?preview=<MAINTENANCE_BYPASS_SECRET> recibe una cookie y navega normal.
export const MAINTENANCE_BYPASS_COOKIE = "maintenanceBypass";

const BYPASS_MAX_AGE = 60 * 60 * 24 * 30; // 30 días

export function isMaintenanceMode() {
    return process.env.MAINTENANCE_MODE === "true";
}

// Devuelve la respuesta de mantenimiento, o null si la petición puede seguir normalmente
export function maintenanceResponse(request: NextRequest, locale: string): NextResponse | null {
    if (!isMaintenanceMode()) return null;

    const { pathname, searchParams } = request.nextUrl;
    const secret = process.env.MAINTENANCE_BYPASS_SECRET;

    // El cron tiene su propia autenticación y debe seguir corriendo
    if (pathname.startsWith("/api/cron")) return null;

    if (secret && searchParams.get("preview") === secret) {
        const cleanUrl = request.nextUrl.clone();
        cleanUrl.searchParams.delete("preview");

        const response = NextResponse.redirect(cleanUrl);
        response.cookies.set(MAINTENANCE_BYPASS_COOKIE, secret, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: BYPASS_MAX_AGE,
        });

        return response;
    }

    if (secret && request.cookies.get(MAINTENANCE_BYPASS_COOKIE)?.value === secret) return null;

    if (pathname.startsWith("/api")) {
        return NextResponse.json(
            { error: "Service temporarily unavailable" },
            { status: 503, headers: { "Retry-After": "3600" } }
        );
    }

    if (pathname.replace(/^\/(en|es)/, "") === "/coming-soon") return null;

    return NextResponse.rewrite(new URL(`/${locale}/coming-soon`, request.url));
}

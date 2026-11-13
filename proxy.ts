import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import {
  ACTIVE_BUSINESS_COOKIE,
  MANAGED_BARBER_COOKIE,
  SESSION_COOKIE,
  getHomePathForRole,
  getSessionFromToken,
} from "@/lib/auth/session";
import { maintenanceResponse } from "@/lib/maintenance";
import { safeRedirectPath } from "@/lib/safe-redirect";

// Inicializamos el middleware de idiomas
const intlMiddleware = createMiddleware(routing);

// Cabeceras de identidad que solo el proxy puede definir a partir de la sesión
const IDENTITY_HEADERS = [
  "x-user-id",
  "x-user-role",
  "x-barber-id",
  "x-barber-status",
  "x-business-id",
  "x-user-banned",
  "x-managing-team-barber",
  "x-terms-pending",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Eliminamos cualquier cabecera de identidad enviada por el cliente
  for (const header of IDENTITY_HEADERS) {
    request.headers.delete(header);
  }

  // Identificar si la URL ya tiene un idioma para no perderlo en las redirecciones
  const localeMatch = pathname.match(/^\/(en|es)/);
  const localePrefix = localeMatch ? localeMatch[0] : "";

  // Extraer el pathname sin el idioma (ej: /es/dashboard -> /dashboard)
  const pathnameWithoutLocale = pathname.replace(/^\/(en|es)/, '');

  // Modo "próximamente" (MAINTENANCE_MODE=true): todo el sitio queda tras la página de espera
  const maintenance = maintenanceResponse(request, localeMatch ? localeMatch[1] : routing.defaultLocale);
  if (maintenance) return maintenance;

  // Determinar qué tipo de ruta es
  const isApiRoute = pathname.startsWith("/api");
  const isProtectedApi = pathname.startsWith("/api/protected") || pathname.startsWith("/api/admin");
  const isProtectedPage = pathnameWithoutLocale.startsWith("/dashboard");

  // Con sesión iniciada, "Iniciar sesión" y "Crear cuenta" llevan directo al panel.
  // Un registro con invitación (?intent=, ?business=) se muestra igual: puede ser para otra cuenta.
  const isLogin = pathnameWithoutLocale === "/login";
  const isPlainRegister = pathnameWithoutLocale === "/register" && request.nextUrl.search === "";
  if ((isLogin || isPlainRegister) && request.cookies.has(SESSION_COOKIE)) {
    try {
      const current = await getSessionFromToken(request.cookies.get(SESSION_COOKIE)?.value);
      if (current) {
        const target = safeRedirectPath(request.nextUrl.searchParams.get("redirectTo")) ?? `${localePrefix}${getHomePathForRole(current.role)}`;
        return NextResponse.redirect(new URL(target, request.url));
      }
    } catch {
      // Sin base de datos se muestra la pantalla normal
    }
  }

  // Si NO es una ruta protegida y NO es una API, solo aplicamos el idioma
  if (!isProtectedApi && !isProtectedPage) {
    return isApiRoute
      ? NextResponse.next({ request: { headers: request.headers } })
      : intlMiddleware(request);
  }

  // --- INICIO DE LÓGICA DE PROTECCIÓN (SESIÓN) ---
  const unauthorized = () => {
    // Al volver a iniciar sesión regresa a la pantalla donde estaba
    const loginUrl = new URL(`${localePrefix}/login`, request.url);
    if (!isProtectedApi) loginUrl.searchParams.set("redirectTo", pathname + request.nextUrl.search);

    const response = isProtectedApi
      ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      : NextResponse.redirect(loginUrl);

    // Token inválido, expirado o de un usuario eliminado
    if (request.cookies.has(SESSION_COOKIE)) {
      response.cookies.delete(SESSION_COOKIE);
    }

    return response;
  };

  let session;

  try {
    // Rol, estado de barbero y negocio se leen de la base en cada petición,
    // así un ban, una aprobación o un cambio de rol aplican sin volver a iniciar sesión
    session = await getSessionFromToken(
      request.cookies.get(SESSION_COOKIE)?.value,
      request.cookies.get(ACTIVE_BUSINESS_COOKIE)?.value,
      request.cookies.get(MANAGED_BARBER_COOKIE)?.value
    );
  } catch (error) {
    console.error("Proxy session error:", error);
    // Una página no debe mostrarle JSON a una persona; la sesión sigue intacta para cuando vuelva la base
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503, headers: { "Retry-After": "30" } });
    }

    return NextResponse.rewrite(new URL(`${localePrefix || `/${routing.defaultLocale}`}/unavailable`, request.url), { status: 503 });
  }

  if (!session) {
    return unauthorized();
  }

  const redirectTo = (path: string) =>
    NextResponse.redirect(new URL(`${localePrefix}${path}`, request.url));

  if (pathnameWithoutLocale.startsWith("/dashboard/barber")) {
    const canAccess =
      session.role === "BARBER" ||
      session.role === "ADMIN" ||
      session.role === "OWNER";

    if (!canAccess) {
      return redirectTo(getHomePathForRole(session.role));
    }
  }

  // Pantallas de la barbería: solo su dueño (el administrador de la plataforma no tiene negocio)
  const ownerOnly = ["/dashboard/admin/team", "/dashboard/admin/customers", "/dashboard/admin/my-business"];
  if (ownerOnly.some((path) => pathnameWithoutLocale.startsWith(path)) && session.role !== "OWNER") {
    return redirectTo(getHomePathForRole(session.role));
  }

  if (pathnameWithoutLocale.startsWith("/dashboard/admin")) {
    const canAccess = session.role === "ADMIN" || session.role === "OWNER";

    if (!canAccess) {
      return redirectTo(getHomePathForRole(session.role));
    }
  }

  request.headers.set("x-user-id", session.userId);
  request.headers.set("x-user-role", session.role);

  if (session.barberId) request.headers.set("x-barber-id", session.barberId);
  if (session.barberStatus) request.headers.set("x-barber-status", session.barberStatus);
  if (session.businessId) request.headers.set("x-business-id", session.businessId);
  if (session.isBanned) request.headers.set("x-user-banned", "true");
  if (session.isManagingTeamBarber) request.headers.set("x-managing-team-barber", "true");
  if (!session.hasAcceptedTerms) request.headers.set("x-terms-pending", "true");

  if (isProtectedApi) {
    return NextResponse.next({ request: { headers: request.headers } });
  } else {
    return intlMiddleware(request);
  }
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
};

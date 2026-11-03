import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import {
  ACTIVE_BUSINESS_COOKIE,
  SESSION_COOKIE,
  getHomePathForRole,
  getSessionFromToken,
} from "@/lib/auth/session";

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

  // Determinar qué tipo de ruta es
  const isApiRoute = pathname.startsWith("/api");
  const isProtectedApi = pathname.startsWith("/api/protected") || pathname.startsWith("/api/admin");
  const isProtectedPage = pathnameWithoutLocale.startsWith("/dashboard");

  // Si NO es una ruta protegida y NO es una API, solo aplicamos el idioma
  if (!isProtectedApi && !isProtectedPage) {
    return isApiRoute
      ? NextResponse.next({ request: { headers: request.headers } })
      : intlMiddleware(request);
  }

  // --- INICIO DE LÓGICA DE PROTECCIÓN (SESIÓN) ---
  const unauthorized = () => {
    const response = isProtectedApi
      ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      : NextResponse.redirect(new URL(`${localePrefix}/login`, request.url));

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
      request.cookies.get(ACTIVE_BUSINESS_COOKIE)?.value
    );
  } catch (error) {
    console.error("Proxy session error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
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

  if (pathnameWithoutLocale.startsWith("/dashboard/customer") && session.role !== "CUSTOMER") {
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

  if (isProtectedApi) {
    return NextResponse.next({ request: { headers: request.headers } });
  } else {
    return intlMiddleware(request);
  }
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
};

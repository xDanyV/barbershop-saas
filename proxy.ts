import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Inicializamos el middleware de idiomas
const intlMiddleware = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

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
    return isApiRoute ? NextResponse.next() : intlMiddleware(request);
  }

  // --- INICIO DE LÓGICA DE PROTECCIÓN (AUTH & JWT) ---
  const token = request.cookies.get("token")?.value;

  if (!token) {
    if (isProtectedApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL(`${localePrefix}/login`, request.url));
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error("JWT_SECRET not defined");
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  try {
    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(token, secret);

    if (!payload.userId || !payload.role) {
      return NextResponse.json({ error: "Invalid token payload" }, { status: 401 });
    }

    const isBookingRoute =
      pathnameWithoutLocale === "/dashboard/customer/barbers" ||
      (pathnameWithoutLocale === "/dashboard/customer" && searchParams.has("barberId"));

    if (isBookingRoute && payload.role === "CUSTOMER") {
      try {
        const fetchResponse = await fetch(`${request.nextUrl.origin}/api/protected/appointments/user`, {
          headers: { Cookie: `token=${token}` },
        });
        const data = await fetchResponse.json();
        if (Array.isArray(data)) {
          const activeAppointments = data.filter(
            (a) => a.status === "PENDING" || a.status === "CONFIRMED"
          );
          if (activeAppointments.length >= 2) {
            const responseRedirect = NextResponse.redirect(new URL(`${localePrefix}/dashboard/customer/home`, request.url));
            responseRedirect.headers.set('Cache-Control', 'no-store, max-age=0');
            return responseRedirect;
          }
        }
      } catch (err) {
        console.error("Error checking active appointments:", err);
      }
    }

    // --- PROTECCIÓN DE RUTAS POR ROL ---
    if (pathnameWithoutLocale.startsWith("/dashboard/barber")) {
      const canAccess = payload.role === "BARBER" || payload.role === "ADMIN";
      if (!canAccess) {
        return NextResponse.redirect(new URL(`${localePrefix}/dashboard/customer/home`, request.url));
      }
    }

    if (pathnameWithoutLocale.startsWith("/dashboard/customer") && payload.role !== "CUSTOMER") {
      return NextResponse.redirect(new URL(`${localePrefix}/dashboard/barber`, request.url));
    }

    if (pathnameWithoutLocale.startsWith("/dashboard/admin") && payload.role !== "ADMIN") {
      return NextResponse.redirect(new URL(`${localePrefix}/dashboard/barber`, request.url));
    }

    // --- LA MAGIA CORREGIDA: INYECCIÓN DIRECTA ---
    // Modificamos directamente las cabeceras de la petición entrante
    request.headers.set("x-user-id", String(payload.userId));
    request.headers.set("x-user-role", String(payload.role));
    if (payload.barberId) request.headers.set("x-barber-id", String(payload.barberId));
    if (payload.barberStatus) request.headers.set("x-barber-status", String(payload.barberStatus));

    if (isProtectedApi) {
      // Para APIs, Next.js usa NextResponse.next() con las cabeceras mutadas
      return NextResponse.next({ request: { headers: request.headers } });
    } else {
      // Para páginas, le entregamos el "request" ya modificado a next-intl 
      // para que arrastre tus cabeceras hasta el Panel de Control
      return intlMiddleware(request);
    }

  } catch (error) {
    console.error("Middleware JWT Error:", error);
    if (isProtectedApi) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }
    return NextResponse.redirect(new URL(`${localePrefix}/login`, request.url));
  }
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
};
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname, searchParams } = request.nextUrl;

  if (!token) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
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

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", String(payload.userId));
    requestHeaders.set("x-user-role", String(payload.role));

    if (payload.barberId) requestHeaders.set("x-barber-id", String(payload.barberId));
    if (payload.barberStatus) requestHeaders.set("x-barber-status", String(payload.barberStatus));

    const isBookingRoute =
      pathname === "/dashboard/customer/barbers" ||
      (pathname === "/dashboard/customer" && searchParams.has("barberId"));

    if (isBookingRoute && payload.role === "CUSTOMER") {
      try {
        const response = await fetch(`${request.nextUrl.origin}/api/protected/appointments/user`, {
          headers: { Cookie: `token=${token}` },
        });
        const data = await response.json();
        if (Array.isArray(data)) {
          const activeAppointments = data.filter(
            (a) => a.status === "PENDING" || a.status === "CONFIRMED"
          );
          if (activeAppointments.length >= 2) {
            const responseRedirect = NextResponse.redirect(new URL("/dashboard/customer/home", request.url));
            responseRedirect.headers.set('Cache-Control', 'no-store, max-age=0');
            return responseRedirect;
          }
        }
      } catch (err) {
        console.error("Error checking active appointments:", err);
      }
    }

    // --- PROTECCIÓN DE RUTAS POR ROL ---

    if (pathname.startsWith("/dashboard/barber")) {
      const canAccess = payload.role === "BARBER" || payload.role === "ADMIN";
      if (!canAccess) {
        return NextResponse.redirect(new URL("/dashboard/customer/home", request.url));
      }
    }

    if (pathname.startsWith("/dashboard/customer") && payload.role !== "CUSTOMER") {
      return NextResponse.redirect(new URL("/dashboard/barber", request.url));
    }

    if (pathname.startsWith("/dashboard/admin") && payload.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard/barber", request.url));
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  } catch (error) {
    console.error("Middleware JWT Error:", error);
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }
}

export const config = {
  matcher: [
    "/api/protected/:path*",
    "/api/admin/:path*",
    "/dashboard/:path*",
  ],
};
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import {
  ACTIVE_BUSINESS_COOKIE,
  MANAGED_BARBER_COOKIE,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  loadSessionIdentity,
  sessionCookieOptions,
  signSessionToken,
} from "@/lib/auth/session";
import {
  RATE_LIMITS,
  assertNotRateLimited,
  consumeRateLimit,
  getClientIp,
  recordRateLimitHit,
  resetRateLimit,
} from "@/lib/rate-limit";
import { errorResponse } from "@/lib/errors";

// Hash de referencia para que un email inexistente tarde lo mismo que una contraseña incorrecta
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Freno a la fuerza bruta: por IP en cada intento y por correo solo en los fallidos
    await consumeRateLimit(`login:ip:${getClientIp(req)}`, RATE_LIMITS.loginIp);
    await assertNotRateLimited(`login:email:${email}`, RATE_LIMITS.loginEmail);

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        password: true,
        sessionVersion: true,
      },
    });

    const passwordMatch = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);

    if (!user || !passwordMatch) {
      await recordRateLimitHit(`login:email:${email}`, RATE_LIMITS.loginEmail);
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const session = await loadSessionIdentity(user.id);

    if (!session) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    await resetRateLimit(`login:email:${email}`);

    const token = await signSessionToken(user.id, user.sessionVersion);

    const response = NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: session.role,
        isBanned: session.isBanned,
        barberId: session.barberId,
        barberStatus: session.barberStatus,
        businessId: session.businessId,
      },
    });

    response.cookies.set(SESSION_COOKIE, token, {
      ...sessionCookieOptions,
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    // Un inicio de sesión nuevo vuelve al negocio por defecto
    response.cookies.delete(ACTIVE_BUSINESS_COOKIE);
    response.cookies.delete(MANAGED_BARBER_COOKIE);

    return response;

  } catch (error) {
    return errorResponse(error, "Login error");
  }
}

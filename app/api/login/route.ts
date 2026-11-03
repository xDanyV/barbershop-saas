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

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        password: true,
      },
    });

    const passwordMatch = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);

    if (!user || !passwordMatch) {
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

    const token = await signSessionToken(user.id);

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
    console.error("Login Error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { SignJWT } from "jose";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET not defined");
    }

    // LÓGICA DE ROLES: Buscamos el perfil si es BARBER o ADMIN
    const isBarberOrAdmin = user.role === "BARBER" || user.role === "ADMIN";

    const barberProfile = isBarberOrAdmin
      ? await prisma.barber.findUnique({ where: { userId: user.id } })
      : null;

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);

    // Generar JWT con información de Barbero (ID y Estatus)
    const token = await new SignJWT({
      userId: user.id,
      role: user.role,
      // Incluimos barberId y barberStatus solo si existen
      ...(barberProfile && {
        barberId: barberProfile.id,
        barberStatus: barberProfile.status
      }),
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1d")
      .sign(secret);

    const { password: _, ...safeUser } = user;

    const response = NextResponse.json({
      message: "Login successful",
      user: {
        ...safeUser,
        ...(barberProfile && {
          barberId: barberProfile.id,
          barberStatus: barberProfile.status
        }),
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return response;

  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
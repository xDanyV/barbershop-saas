import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { createBarberFromUser } from "@/lib/services/barber.service";

export async function POST(req: Request) {
    const body = await req.json();
    const { name, email, password, phone, role } = body;

    if (!email || !password) {
        return NextResponse.json(
            { error: "Email and password are required" },
            { status: 400 }
        );
    }

    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        return NextResponse.json(
            { error: "User already exists" },
            { status: 400 }
        );
    }

    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;

    const hashedPassword = await bcrypt.hash(password, 10);

    const finalRole = (isFirstUser && role === "BARBER") ? "ADMIN" : (role || "CUSTOMER");

    const newUser = await prisma.user.create({
        data: {
            name,
            email,
            phone,
            password: hashedPassword,
            role: finalRole, 
        },
    });

    if (role === "BARBER" || finalRole === "ADMIN") {
        await createBarberFromUser(newUser.id, isFirstUser);
    }

    return NextResponse.json(
      { message: "User created successfully" },
      { status: 201 }
    );
}
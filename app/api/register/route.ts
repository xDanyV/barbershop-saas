import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

export async function GET() {
    return new Response("API working");
}

export async function POST(req: Request) {
    const body = await req.json();
    const { name, email, password, phone } = body;

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

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            name,
            email,
            phone,
            password: hashedPassword,
        },
    });

    const { password: _, ...safeUser } = user;
    
    return NextResponse.json(safeUser);
}
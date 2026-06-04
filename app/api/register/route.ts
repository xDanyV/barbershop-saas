import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, password, phone, role } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: email },
                    { phone: phone }
                ]
            },
        });

        if (existingUser) {
            if (existingUser.email === email) {
                return NextResponse.json(
                    { error: "This email address is already registered." },
                    { status: 400 }
                );
            }
            if (existingUser.phone === phone) {
                return NextResponse.json(
                    { error: "This phone number is already registered." },
                    { status: 400 }
                );
            }
        }

        const userCount = await prisma.user.count();
        const isFirstUser = userCount === 0;

        const hashedPassword = await bcrypt.hash(password, 10);

        const finalRole = isFirstUser ? "ADMIN" : "CUSTOMER";

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                phone,
                password: hashedPassword,
                role: finalRole,
            },
        });

        return NextResponse.json(
            { message: "User created successfully" },
            { status: 201 }
        );

    } catch (error) {
        console.error("Registration route error:", error);
        return NextResponse.json(
            { error: "An unexpected error occurred. Please try again." },
            { status: 500 }
        );
    }
}
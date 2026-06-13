import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { BarberStatus, Role } from "@prisma/client";

function createSlug(value: string) {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ñ/g, "n")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

function extractBusinessSlug(value: string) {
    let rawValue = value.trim();

    try {
        const url = new URL(rawValue);
        rawValue = url.pathname;
    } catch {
        // If it is not a full URL, use it as plain text/path.
    }

    const segments = rawValue.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1] ?? rawValue;

    return createSlug(lastSegment);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, password, phone, role, businessSlug } = body;

        const normalizedName =
            typeof name === "string" ? name.trim() : "";

        const normalizedEmail =
            typeof email === "string" ? email.trim().toLowerCase() : "";

        const normalizedPhone =
            typeof phone === "string" ? phone.trim() : "";

        if (!normalizedEmail || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        if (!normalizedName) {
            return NextResponse.json(
                { error: "Name is required" },
                { status: 400 }
            );
        }

        if (!normalizedPhone) {
            return NextResponse.json(
                { error: "Phone number is required" },
                { status: 400 }
            );
        }

        const duplicateFilters = [
            { email: normalizedEmail },
            { phone: normalizedPhone },
        ];

        const existingUser = await prisma.user.findFirst({
            where: {
                OR: duplicateFilters,
            },
        });

        if (existingUser) {
            if (existingUser.email === normalizedEmail) {
                return NextResponse.json(
                    { error: "This email address is already registered." },
                    { status: 400 }
                );
            }

            if (existingUser.phone === normalizedPhone) {
                return NextResponse.json(
                    { error: "This phone number is already registered." },
                    { status: 400 }
                );
            }
        }

        const userCount = await prisma.user.count();
        const isFirstUser = userCount === 0;

        const requestedRole = role === Role.BARBER ? Role.BARBER : Role.CUSTOMER;

        let barberBusiness: { id: string; name: string } | null = null;

        if (!isFirstUser && requestedRole === Role.BARBER) {
            if (!businessSlug || typeof businessSlug !== "string") {
                return NextResponse.json(
                    { error: "Business slug is required for barber accounts." },
                    { status: 400 }
                );
            }

            const slug = extractBusinessSlug(businessSlug);

            if (!slug) {
                return NextResponse.json(
                    { error: "Invalid business slug." },
                    { status: 400 }
                );
            }

            const business = await prisma.business.findUnique({
                where: { slug },
                select: {
                    id: true,
                    name: true,
                    active: true,
                },
            });

            if (!business || !business.active) {
                return NextResponse.json(
                    { error: "Business not found or inactive." },
                    { status: 404 }
                );
            }

            barberBusiness = {
                id: business.id,
                name: business.name,
            };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const finalRole = isFirstUser ? Role.ADMIN : requestedRole;

        await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    name: normalizedName,
                    email: normalizedEmail,
                    phone: normalizedPhone,
                    password: hashedPassword,
                    role: finalRole,
                },
            });

            if (finalRole === Role.BARBER && barberBusiness) {
                await tx.barber.create({
                    data: {
                        userId: newUser.id,
                        businessId: barberBusiness.id,
                        status: BarberStatus.PENDING,
                    },
                });
            }
        });

        return NextResponse.json(
            {
                message:
                    finalRole === Role.BARBER
                        ? "Barber account created successfully. Waiting for owner approval."
                        : "User created successfully",
            },
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
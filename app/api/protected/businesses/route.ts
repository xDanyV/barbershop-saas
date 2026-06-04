import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";

function createSlug(name: string) {
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ñ/g, "n")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

async function generateUniqueSlug(name: string) {
    const baseSlug = createSlug(name);
    let slug = baseSlug;
    let counter = 1;

    while (await prisma.business.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }

    return slug;
}

export async function GET(req: NextRequest) {
    try {
        const userId = req.headers.get("x-user-id");

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const businesses = await prisma.business.findMany({
            where: { ownerId: userId },
            include: {
                settings: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(businesses);
    } catch (error) {
        console.error("Get businesses error:", error);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const userId = req.headers.get("x-user-id");

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, description, phone, address, logoUrl, coverUrl } = body;

        if (!name || name.trim().length < 3) {
            return NextResponse.json(
                { error: "Business name must be at least 3 characters long" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                role: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const slug = await generateUniqueSlug(name);

        const business = await prisma.$transaction(async (tx) => {
            const newBusiness = await tx.business.create({
                data: {
                    name: name.trim(),
                    slug,
                    description: description?.trim() || null,
                    phone: phone?.trim() || null,
                    address: address?.trim() || null,
                    logoUrl: logoUrl || null,
                    coverUrl: coverUrl || null,
                    ownerId: user.id,
                    settings: {
                        create: {},
                    },
                },
                include: {
                    settings: true,
                },
            });

            if (user.role === Role.CUSTOMER) {
                await tx.user.update({
                    where: { id: user.id },
                    data: { role: Role.OWNER },
                });
            }

            return newBusiness;
        });

        return NextResponse.json(
            {
                message: "Business created successfully",
                business,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Create business error:", error);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET() {
    const headerList = await headers();
    const role = headerList.get("x-user-role");
    const businessId = headerList.get("x-business-id");

    if (role !== "ADMIN" && role !== "OWNER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (role === "OWNER" && !businessId) {
        return NextResponse.json({ error: "Business context is required" }, { status: 403 });
    }

    try {
        const pendingBarbers = await prisma.barber.findMany({
            where: {
                status: "PENDING",
                ...(role === "OWNER" ? { businessId: businessId! } : {}),
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(pendingBarbers);
    } catch (error) {
        console.error("Error fetching pending barbers:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const headerList = await headers();
    const role = headerList.get("x-user-role");
    const businessId = headerList.get("x-business-id");

    if (role !== "ADMIN" && role !== "OWNER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (role === "OWNER" && !businessId) {
        return NextResponse.json({ error: "Business context is required" }, { status: 403 });
    }

    try {
        const { barberId, status } = await req.json();

        if (!barberId || !status) {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 });
        }

        const existingBarber = await prisma.barber.findUnique({
            where: { id: barberId },
            select: {
                id: true,
                businessId: true,
            },
        });

        if (!existingBarber) {
            return NextResponse.json({ error: "Barber not found" }, { status: 404 });
        }

        if (role === "OWNER" && existingBarber.businessId !== businessId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        await prisma.barber.update({
            where: { id: barberId },
            data: { status },
        });

        return NextResponse.json({ message: "Status updated successfully" });
    } catch (error) {
        console.error("Error updating barber status:", error);
        return NextResponse.json({ error: "Error updating barber status" }, { status: 500 });
    }
}
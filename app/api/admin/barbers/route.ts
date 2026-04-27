import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET() {
    const headerList = await headers();
    const role = headerList.get("x-user-role");

    if (role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const pendingBarbers = await prisma.barber.findMany({
            where: {
                status: "PENDING",
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

    if (role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const { barberId, status } = await req.json();

        const updatedBarber = await prisma.barber.update({
            where: { id: barberId },
            data: { status },
        });

        return NextResponse.json({ message: "Status updated successfully" });
    } catch (error) {
        return NextResponse.json({ error: "Error updating barber status" }, { status: 500 });
    }
}
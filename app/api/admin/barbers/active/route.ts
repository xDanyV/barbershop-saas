import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET() {
    try {
        const headersList = await headers();
        const role = headersList.get("x-user-role");
        const userId = headersList.get("x-user-id");
        const businessId = headersList.get("x-business-id");

        if (role !== "ADMIN" && role !== "OWNER") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        if (role === "OWNER" && !businessId) {
            return NextResponse.json({ error: "Business context is required" }, { status: 403 });
        }

        const managedBarbers = await prisma.barber.findMany({
            where: {
                status: {
                    not: "PENDING",
                },
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
        });

        const barbersWithSelfFlag = managedBarbers.map((barber) => ({
            ...barber,
            isSelf: barber.userId === userId,
        }));

        return NextResponse.json(barbersWithSelfFlag);
    } catch (error) {
        console.error("Error fetching managed barbers:", error);
        return NextResponse.json({ error: "Failed to fetch barbers" }, { status: 500 });
    }
}
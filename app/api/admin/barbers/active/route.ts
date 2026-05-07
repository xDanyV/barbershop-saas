import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET() {

    interface Barber {
        userId: string;
        name?: string;
        email?: string;
    }

    try {
        const headersList = await headers();
        const role = headersList.get("x-user-role");
        const userId = headersList.get("x-user-id");

        if (role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const managedBarbers = await prisma.barber.findMany({
            where: {
                status: {
                    not: "PENDING"
                }
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


        const barbersWithSelfFlag = managedBarbers.map((barber: Barber) => ({
            ...barber,
            isSelf: barber.userId === userId
        }));

        return NextResponse.json(barbersWithSelfFlag);
    } catch (error) {
        console.error("Error fetching managed barbers:", error);
        return NextResponse.json({ error: "Failed to fetch barbers" }, { status: 500 });
    }
}
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const businesses = await prisma.business.findMany({
            where: {
                active: true,
            },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                phone: true,
                address: true,
                logoUrl: true,
                coverUrl: true,
                settings: {
                    select: {
                        isServiceActive: true,
                        maintenanceMessage: true,
                    },
                },
                barbers: {
                    where: {
                        active: true,
                        status: "APPROVED",
                    },
                    select: {
                        id: true,
                    },
                },
                services: {
                    where: {
                        active: true,
                        barber: {
                            active: true,
                            status: "APPROVED",
                        },
                    },
                    select: {
                        id: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        const formattedBusinesses = businesses.map((business) => ({
            id: business.id,
            name: business.name,
            slug: business.slug,
            description: business.description,
            phone: business.phone,
            address: business.address,
            logoUrl: business.logoUrl,
            coverUrl: business.coverUrl,
            settings: business.settings,
            barberCount: business.barbers.length,
            serviceCount: business.services.length,
        }));

        return NextResponse.json(formattedBusinesses);
    } catch (error) {
        console.error("Get public businesses error:", error);

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
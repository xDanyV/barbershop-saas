import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publicBusinessWhere } from "@/lib/billing/status";
import { computeBusinessHours } from "@/lib/business-hours";
import { getBusinessRatings } from "@/lib/services/review.service";

export async function GET() {
    try {
        const businesses = await prisma.business.findMany({
            where: publicBusinessWhere,
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                phone: true,
                address: true,
                logoUrl: true,
                coverUrl: true,
                timezone: true,
                latitude: true,
                longitude: true,
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
                        availability: { select: { dayOfWeek: true, startTime: true, endTime: true } },
                        _count: { select: { services: { where: { active: true } } } },
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

        const ratings = await getBusinessRatings(businesses.map((business) => business.id));

        const formattedBusinesses = businesses.map((business) => ({
            rating: ratings.get(business.id) ?? null,
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
            timezone: business.timezone,
            latitude: business.latitude,
            longitude: business.longitude,
            // Horario de la barbería (para "Abierto ahora") y si alguien ya se puede reservar
            hours: computeBusinessHours(business.barbers.flatMap((barber) => barber.availability)),
            bookable: business.barbers.some((barber) => barber.availability.length > 0 && barber._count.services > 0),
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
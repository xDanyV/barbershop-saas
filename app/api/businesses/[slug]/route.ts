import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
    params: Promise<{
        slug: string;
    }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const { slug } = await context.params;

        if (!slug) {
            return NextResponse.json(
                { error: "Business slug is required" },
                { status: 400 }
            );
        }

        const business = await prisma.business.findUnique({
            where: {
                slug,
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
                active: true,
                createdAt: true,
                updatedAt: true,
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
                        user: {
                            select: {
                                name: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: "asc",
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
                        name: true,
                        price: true,
                        duration: true,
                        barberId: true,
                        barber: {
                            select: {
                                user: {
                                    select: {
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                },
                gallery: {
                    where: {
                        active: true,
                    },
                    select: {
                        id: true,
                        imageUrl: true,
                        caption: true,
                        position: true,
                        createdAt: true,
                    },
                    orderBy: [
                        {
                            position: "asc",
                        },
                        {
                            createdAt: "desc",
                        },
                    ],
                },
                posts: {
                    where: {
                        active: true,
                    },
                    select: {
                        id: true,
                        content: true,
                        imageUrl: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                },
            },
        });

        if (!business || !business.active) {
            return NextResponse.json(
                { error: "Business not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            business,
        });
    } catch (error) {
        console.error("Get public business error:", error);

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
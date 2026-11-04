import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/api/auth";

const DAY_MS = 24 * 60 * 60 * 1000;

// Todos los negocios de la plataforma con su dueño y su actividad reciente
export async function GET(request: NextRequest) {
    try {
        requireAuth(request, ["ADMIN"]);

        const since = new Date(Date.now() - 30 * DAY_MS);

        const [businesses, recent, customers] = await Promise.all([
            prisma.business.findMany({
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    phone: true,
                    active: true,
                    createdAt: true,
                    owner: { select: { name: true, email: true, phone: true } },
                    subscription: { select: { billingStatus: true, plan: true } },
                    _count: { select: { barbers: true, services: true } },
                },
            }),
            prisma.appointment.groupBy({
                by: ["businessId"],
                where: { date: { gte: since, lte: new Date() }, status: { not: "CANCELLED" } },
                _count: { _all: true },
            }),
            prisma.user.count({ where: { role: "CUSTOMER", deletedAt: null } }),
        ]);

        const recentByBusiness = new Map(recent.map((row) => [row.businessId, row._count._all]));

        return NextResponse.json({
            businesses: businesses.map((business) => ({
                ...business,
                appointmentsLast30Days: recentByBusiness.get(business.id) ?? 0,
            })),
            stats: {
                businesses: businesses.length,
                active: businesses.filter((business) => business.active).length,
                customers,
                appointmentsLast30Days: recent.reduce((sum, row) => sum + row._count._all, 0),
            },
        });
    } catch (error) {
        return errorResponse(error, "Get platform businesses error");
    }
}

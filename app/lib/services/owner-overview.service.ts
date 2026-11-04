import { prisma } from "@/lib/prisma";
import { computeOwnerMetrics } from "@/lib/business-metrics";
import { AppError } from "@/lib/errors";
import { addDaysToKey, addMonthsToKey, resolveTimezone, toDateKey, zonedToUtc } from "@/lib/time/zoned";

// Lo que falta para que el negocio reciba reservas, más las cifras de su actividad
export async function getOwnerOverview(businessId: string) {
    const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { name: true, slug: true, phone: true, address: true, timezone: true },
    });

    if (!business) {
        throw new AppError("Business not found", 404);
    }

    const timezone = resolveTimezone(business.timezone);
    const now = new Date();
    const todayKey = toDateKey(now, timezone);

    // Desde el inicio del mes pasado (cubre también los últimos 30 días) hasta la próxima semana
    const from = zonedToUtc(`${addMonthsToKey(todayKey, -2).slice(0, 7)}-01`, "00:00", timezone);
    const to = zonedToUtc(addDaysToKey(todayKey, 9), "00:00", timezone);

    const [services, hours, onlineBookings, appointments] = await Promise.all([
        prisma.service.count({ where: { businessId, active: true } }),
        prisma.availability.count({ where: { barber: { businessId, active: true, status: "APPROVED" } } }),
        prisma.appointment.count({ where: { businessId, userId: { not: null } } }),
        prisma.appointment.findMany({
            where: { businessId, date: { gte: from, lt: to }, status: { not: "CANCELLED" } },
            select: {
                date: true,
                status: true,
                userId: true,
                walkInName: true,
                barberId: true,
                barber: { select: { user: { select: { name: true } } } },
                service: { select: { name: true, priceCents: true } },
            },
        }),
    ]);

    return {
        slug: business.slug,
        checklist: {
            profile: Boolean(business.phone && business.address),
            services: services > 0,
            hours: hours > 0,
            firstBooking: onlineBookings > 0,
        },
        metrics: computeOwnerMetrics(
            appointments.map((row) => ({
                date: row.date,
                status: row.status,
                userId: row.userId,
                walkInName: row.walkInName,
                barberId: row.barberId,
                barberName: row.barber.user.name,
                serviceName: row.service.name,
                priceCents: row.service.priceCents,
            })),
            now,
            timezone
        ),
    };
}

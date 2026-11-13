import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { revalidateBusinessPages } from "@/lib/cache/business-pages";

// El cliente califica una cita ya atendida, una sola vez y dentro de 30 días
export const REVIEW_WINDOW_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

type Actor = { userId: string; role: string; barberId: string | null; businessId: string | null };

export function isReviewable(appointment: { status: string; date: Date }, now = new Date()) {
    const attended = appointment.status === "COMPLETED" || (appointment.status === "CONFIRMED" && appointment.date < now);
    return attended && now.getTime() - appointment.date.getTime() <= REVIEW_WINDOW_DAYS * DAY_MS;
}

export async function createReview(userId: string, input: { appointmentId: string; rating: number; comment?: string | null }) {
    const appointment = await prisma.appointment.findUnique({
        where: { id: input.appointmentId },
        select: {
            userId: true,
            status: true,
            date: true,
            barberId: true,
            businessId: true,
            review: { select: { id: true } },
            business: { select: { settings: { select: { reviewsEnabled: true } } } },
        },
    });

    if (!appointment || appointment.userId !== userId) throw new AppError("Appointment not found", 404);
    if (appointment.business.settings?.reviewsEnabled === false) throw new AppError("This barbershop is not taking reviews", 403, "REVIEWS_DISABLED");
    if (appointment.review) throw new AppError("You already rated this appointment", 409, "ALREADY_REVIEWED");
    if (!isReviewable(appointment)) throw new AppError("This appointment can no longer be rated", 400, "NOT_REVIEWABLE");

    const review = await prisma.review.create({
        data: {
            appointmentId: input.appointmentId,
            businessId: appointment.businessId,
            barberId: appointment.barberId,
            userId,
            rating: input.rating,
            comment: input.comment?.trim() || null,
        },
    });

    await revalidateBusinessPages(appointment.businessId);
    return review;
}

// Promedio y número de reseñas visibles; null si la barbería no recibe reseñas o aún no tiene
export async function getBusinessRatings(businessIds: string[]) {
    if (businessIds.length === 0) return new Map<string, { average: number; count: number }>();

    const rows = await prisma.review.groupBy({
        by: ["businessId"],
        where: { businessId: { in: businessIds }, hidden: false, business: { settings: { is: { reviewsEnabled: true } } } },
        _avg: { rating: true },
        _count: { _all: true },
    });

    return new Map(rows.map((row) => [row.businessId, { average: Math.round((row._avg.rating ?? 0) * 10) / 10, count: row._count._all }]));
}

// Dueño: todas las de su barbería. Barbero: las suyas.
function scopeFor(actor: Actor) {
    if (actor.role === "OWNER" && actor.businessId) return { businessId: actor.businessId };
    if (actor.barberId) return { barberId: actor.barberId };
    throw new AppError("Forbidden", 403);
}

export async function listReviewsForTeam(actor: Actor) {
    const scope = scopeFor(actor);
    const reviews = await prisma.review.findMany({
        where: scope,
        orderBy: { createdAt: "desc" },
        take: 200,
        select: {
            id: true,
            rating: true,
            comment: true,
            hidden: true,
            reply: true,
            createdAt: true,
            user: { select: { name: true } },
            barber: { select: { user: { select: { name: true } } } },
            appointment: { select: { date: true, service: { select: { name: true } } } },
        },
    });

    return reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        hidden: review.hidden,
        reply: review.reply,
        createdAt: review.createdAt,
        customer: (review.user.name ?? "").split(" ")[0],
        barber: review.barber.user.name,
        service: review.appointment.service.name,
        date: review.appointment.date,
    }));
}

export async function moderateReview(reviewId: string, actor: Actor, change: { hidden?: boolean; reply?: string | null }) {
    const review = await prisma.review.findUnique({ where: { id: reviewId }, select: { businessId: true, barberId: true } });
    if (!review) throw new AppError("Review not found", 404);

    const scope = scopeFor(actor);
    const allowed = "businessId" in scope ? scope.businessId === review.businessId : scope.barberId === review.barberId;
    if (!allowed) throw new AppError("Forbidden", 403);

    const reply = change.reply === undefined ? undefined : change.reply?.trim() || null;
    const updated = await prisma.review.update({
        where: { id: reviewId },
        data: {
            ...(change.hidden !== undefined && { hidden: change.hidden }),
            ...(reply !== undefined && { reply, repliedAt: reply ? new Date() : null }),
        },
        select: { id: true, hidden: true, reply: true },
    });

    await revalidateBusinessPages(review.businessId);
    return updated;
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/validation";
import { RATE_LIMITS, consumeRateLimit } from "@/lib/rate-limit";
import { createReview, listReviewsForTeam } from "@/lib/services/review.service";
import { notifyReviewLater } from "@/lib/notifications/appointments";

const reviewSchema = z.object({
    appointmentId: z.string().min(1).max(100),
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().max(500).nullish(),
});

// Reseñas que el equipo puede revisar y moderar
export async function GET(request: NextRequest) {
    try {
        const auth = requireAuth(request, ["OWNER", "BARBER", "ADMIN"]);
        return NextResponse.json(await listReviewsForTeam(auth));
    } catch (error) {
        return errorResponse(error, "List reviews error");
    }
}

// El cliente califica una de sus citas
export async function POST(request: NextRequest) {
    try {
        const { userId } = requireAuth(request);
        await consumeRateLimit(`booking:user:${userId}`, RATE_LIMITS.bookingUser);
        const body = await parseJsonBody(request, reviewSchema);

        const review = await createReview(userId, body);
        notifyReviewLater(review.id);

        return NextResponse.json({ id: review.id, rating: review.rating }, { status: 201 });
    } catch (error) {
        return errorResponse(error, "Create review error");
    }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/validation";
import { moderateReview } from "@/lib/services/review.service";

const moderateSchema = z.object({
    hidden: z.boolean().optional(),
    reply: z.string().trim().max(500).nullish(),
});

// Ocultar/mostrar una reseña o responderla (dueño: toda su barbería; barbero: las suyas)
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const auth = requireAuth(request, ["OWNER", "BARBER", "ADMIN"]);
        const { id } = await context.params;
        const change = await parseJsonBody(request, moderateSchema);

        return NextResponse.json(await moderateReview(id, auth, change));
    } catch (error) {
        return errorResponse(error, "Moderate review error");
    }
}

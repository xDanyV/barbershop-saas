import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AppError, errorResponse } from "@/lib/errors";
import { MANAGED_BARBER_COOKIE, sessionCookieOptions } from "@/lib/auth/session";
import { requireOwnerAuth } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/validation";
import { managedBarberSchema } from "@/lib/validations/schemas";

// El OWNER elige qué barbero de su equipo gestiona (agenda, servicios, excepciones).
// barberId null vuelve a su propio perfil.
export async function POST(request: NextRequest) {
    try {
        const { businessId } = requireOwnerAuth(request);
        const { barberId } = await parseJsonBody(request, managedBarberSchema);

        const response = NextResponse.json({ barberId: barberId ?? null });

        if (!barberId) {
            response.cookies.delete(MANAGED_BARBER_COOKIE);
            return response;
        }

        const barber = await prisma.barber.findFirst({
            where: {
                id: barberId,
                businessId,
                status: "APPROVED",
                active: true,
            },
            select: { id: true },
        });

        if (!barber) {
            throw new AppError("Barber not found in your team", 404);
        }

        response.cookies.set(MANAGED_BARBER_COOKIE, barber.id, {
            ...sessionCookieOptions,
            maxAge: 60 * 60 * 24,
        });

        return response;
    } catch (error) {
        return errorResponse(error, "Select managed barber error");
    }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/errors";
import { MANAGED_BARBER_COOKIE, sessionCookieOptions } from "@/lib/auth/session";

// El OWNER elige qué barbero de su equipo gestiona (agenda, servicios, excepciones).
// barberId null vuelve a su propio perfil.
export async function POST(request: NextRequest) {
    try {
        const role = request.headers.get("x-user-role");
        const businessId = request.headers.get("x-business-id");

        if (role !== "OWNER" || !businessId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json().catch(() => ({}));
        const barberId = typeof body.barberId === "string" && body.barberId ? body.barberId : null;

        const response = NextResponse.json({ barberId });

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
            return NextResponse.json({ error: "Barber not found in your team" }, { status: 404 });
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

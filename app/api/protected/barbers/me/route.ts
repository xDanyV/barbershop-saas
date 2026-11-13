import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/errors";
import { requireBarberAuth } from "@/lib/api/auth";

// Perfil de barbero activo (el propio o, para un OWNER, el barbero del equipo que gestiona)
export async function GET(request: NextRequest) {
    try {
        const { barberId, businessId, isManagingTeamBarber } = requireBarberAuth(request);
        const barber = await prisma.barber.findUnique({
            where: { id: barberId },
            select: { user: { select: { name: true } } },
        });

        return NextResponse.json({
            barberId,
            businessId,
            // El dueño ve la agenda de otro barbero: la pantalla lo dice con su nombre
            managing: isManagingTeamBarber,
            name: barber?.user.name ?? null,
        });
    } catch (error) {
        return errorResponse(error, "Get barber profile error");
    }
}

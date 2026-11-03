import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { requireBarberAuth } from "@/lib/api/auth";

// Perfil de barbero activo (el propio o, para un OWNER, el barbero del equipo que gestiona)
export async function GET(request: NextRequest) {
    try {
        const { barberId, businessId } = requireBarberAuth(request);

        return NextResponse.json({ barberId, businessId });
    } catch (error) {
        return errorResponse(error, "Get barber profile error");
    }
}

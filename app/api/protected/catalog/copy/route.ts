import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { requireBarberAuth } from "@/lib/api/auth";
import { copyBusinessServices, getBusinessServicesToCopy } from "@/lib/services/catalog.service";

// Lo que se copiaría: el barbero lo revisa antes de usarlo
export async function GET(request: NextRequest) {
    try {
        const { barberId } = requireBarberAuth(request);

        return NextResponse.json(await getBusinessServicesToCopy(barberId));
    } catch (error) {
        return errorResponse(error, "Catalog copy preview error");
    }
}

// Copia los servicios de la barbería; después cada quien ajusta precios y tiempos
export async function POST(request: NextRequest) {
    try {
        const { barberId } = requireBarberAuth(request);

        return NextResponse.json(await copyBusinessServices(barberId), { status: 201 });
    } catch (error) {
        return errorResponse(error, "Catalog copy error");
    }
}

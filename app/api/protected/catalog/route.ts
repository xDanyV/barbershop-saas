import { NextRequest, NextResponse } from "next/server";
import { createCatalogService, getActiveServices } from "@/lib/services/catalog.service";
import { AppError, errorResponse } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { requireBarberAuth } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/validation";
import { createServiceSchema, toCents } from "@/lib/validations/schemas";
import { notifyBarberReadyLater } from "@/lib/notifications/appointments";

export async function POST(request: NextRequest) {
    try {
        const auth = requireBarberAuth(request);
        const { name, price, duration, applyToTeam } = await parseJsonBody(request, createServiceSchema);
        const data = { name, priceCents: toCents(price), duration };

        if (!applyToTeam) {
            const service = await createCatalogService(data, auth.barberId);
            notifyBarberReadyLater(auth.barberId);
            return NextResponse.json(service, { status: 201 });
        }

        if (auth.role !== "OWNER" || !auth.businessId) {
            throw new AppError("Forbidden", 403);
        }

        // Un mismo servicio para cada barbero activo; quien ya lo tenga se queda como está
        const team = await prisma.barber.findMany({
            where: { businessId: auth.businessId, status: "APPROVED", active: true },
            select: { id: true },
        });

        let created = 0;

        for (const barber of team) {
            try {
                await createCatalogService(data, barber.id);
                notifyBarberReadyLater(barber.id);
                created++;
            } catch (error) {
                if (!(error instanceof AppError && error.status === 409)) throw error;
            }
        }

        return NextResponse.json({ created, skipped: team.length - created }, { status: 201 });
    } catch (error) {
        return errorResponse(error, "Catalog POST error");
    }
}

export async function GET(request: NextRequest) {
    try {
        const { barberId } = requireBarberAuth(request);

        return NextResponse.json(await getActiveServices(barberId));
    } catch (error) {
        return errorResponse(error, "Catalog GET error");
    }
}

import { NextRequest, NextResponse } from "next/server";
import { createCatalogService, getActiveServices } from "@/lib/services/catalog.service";
import { errorResponse } from "@/lib/errors";
import { requireBarberAuth } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/validation";
import { createServiceSchema, toCents } from "@/lib/validations/schemas";

export async function POST(request: NextRequest) {
    try {
        const { barberId } = requireBarberAuth(request);
        const { name, price, duration } = await parseJsonBody(request, createServiceSchema);

        const service = await createCatalogService(
            { name, priceCents: toCents(price), duration },
            barberId
        );

        return NextResponse.json(service, { status: 201 });
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

import { NextRequest, NextResponse } from "next/server";
import { createCatalogService } from "@/lib/services/catalog.service";
import { prisma } from "@/lib/prisma";

// Create a new service in the catalog (only for barbers)
export async function POST(request: NextRequest) {
    try {
        const role = request.headers.get("x-user-role");
        const barberId = request.headers.get("x-barber-id");

        if (role !== "BARBER" || !barberId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { name, price, duration } = body;

        const service = await createCatalogService(
            name,
            Number(price),
            Number(duration),
            role,
            barberId
        );

        return NextResponse.json(service, { status: 201 });

    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}

// Get all services for the authenticated barber
export async function GET(request: NextRequest) {
    try {
        const role = request.headers.get("x-user-role");
        const barberId = request.headers.get("x-barber-id");

        if (role !== "BARBER" || !barberId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const services = await prisma.service.findMany({
            where: { barberId, active: true },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(services);

    } catch {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}


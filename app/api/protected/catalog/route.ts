import { NextRequest, NextResponse } from "next/server";
import { createCatalogService } from "@/lib/services/catalog.service";
import { prisma } from "@/lib/prisma";

function canManageCatalog(role: string | null) {
    return role === "BARBER" || role === "OWNER" || role === "ADMIN";
}

export async function POST(request: NextRequest) {
    try {
        const role = request.headers.get("x-user-role");
        const barberId = request.headers.get("x-barber-id");

        if (!canManageCatalog(role) || !barberId) {
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

export async function GET(request: NextRequest) {
    try {
        const role = request.headers.get("x-user-role");
        const barberId = request.headers.get("x-barber-id");

        if (!canManageCatalog(role) || !barberId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const services = await prisma.service.findMany({
            where: {
                barberId,
                active: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(services);
    } catch (error) {
        console.error("Catalog GET error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
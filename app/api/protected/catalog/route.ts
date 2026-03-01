import { NextRequest, NextResponse } from "next/server";
import { createCatalogService } from "@/lib/services/catalog.service";

//create a new service in the catalog (only for barbers)
export async function POST(request: NextRequest) {
    try {
        const role = request.headers.get("x-user-role");

        if (role !== "BARBER") {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { name, price, duration } = body;

        const service = await createCatalogService(
            name,
            Number(price),
            Number(duration),
            role
        );

        return NextResponse.json(service, { status: 201 });

    } catch {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

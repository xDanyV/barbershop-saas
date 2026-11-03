import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

// Mantenimiento global de la plataforma (solo ADMIN).
// Los ajustes de cada negocio se editan en "Mi negocio" (/api/protected/businesses/me).
async function isAdmin() {
    const headersList = await headers();
    return headersList.get("x-user-role") === "ADMIN";
}

export async function GET() {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const settings = await prisma.systemSettings.upsert({
            where: { id: "global" },
            update: {},
            create: { id: "global", isServiceActive: true },
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error("Error fetching settings:", error);
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();

        const isServiceActive =
            typeof body.isServiceActive === "boolean" ? body.isServiceActive : undefined;
        const maintenanceMessage =
            typeof body.maintenanceMessage === "string" ? body.maintenanceMessage.trim() : undefined;

        const updatedSettings = await prisma.systemSettings.upsert({
            where: { id: "global" },
            update: { isServiceActive, maintenanceMessage },
            create: { id: "global", isServiceActive, maintenanceMessage },
        });

        return NextResponse.json({ success: true, settings: updatedSettings });
    } catch (error) {
        console.error("Error updating settings:", error);
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }
}

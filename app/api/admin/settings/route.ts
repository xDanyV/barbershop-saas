import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET() {
    try {
        const headersList = await headers();
        const role = headersList.get("x-user-role");

        if (role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Buscamos la configuración o la creamos si es la primera vez que se accede
        let settings = await prisma.systemSettings.findUnique({
            where: { id: "global" }
        });

        if (!settings) {
            settings = await prisma.systemSettings.create({
                data: { id: "global", isServiceActive: true }
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error("Error fetching settings:", error);
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const headersList = await headers();
        const role = headersList.get("x-user-role");

        if (role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const { isServiceActive, maintenanceMessage } = body;

        // Upsert garantiza que si por alguna razón no existe, lo crea al intentar actualizar
        const updatedSettings = await prisma.systemSettings.upsert({
            where: { id: "global" },
            update: { isServiceActive, maintenanceMessage },
            create: { id: "global", isServiceActive, maintenanceMessage }
        });

        return NextResponse.json({ success: true, settings: updatedSettings });
    } catch (error) {
        console.error("Error updating settings:", error);
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }
}
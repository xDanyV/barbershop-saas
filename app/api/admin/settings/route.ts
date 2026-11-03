import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/validation";
import { systemSettingsSchema } from "@/lib/validations/schemas";

// Mantenimiento global de la plataforma (solo ADMIN).
// Los ajustes de cada negocio se editan en "Mi negocio" (/api/protected/businesses/me).
export async function GET(request: NextRequest) {
    try {
        requireAuth(request, ["ADMIN"]);

        const settings = await prisma.systemSettings.upsert({
            where: { id: "global" },
            update: {},
            create: { id: "global", isServiceActive: true },
        });

        return NextResponse.json(settings);
    } catch (error) {
        return errorResponse(error, "Error fetching settings");
    }
}

export async function PATCH(request: NextRequest) {
    try {
        requireAuth(request, ["ADMIN"]);
        const data = await parseJsonBody(request, systemSettingsSchema);

        const updatedSettings = await prisma.systemSettings.upsert({
            where: { id: "global" },
            update: data,
            create: { id: "global", ...data },
        });

        return NextResponse.json({ success: true, settings: updatedSettings });
    } catch (error) {
        return errorResponse(error, "Error updating settings");
    }
}

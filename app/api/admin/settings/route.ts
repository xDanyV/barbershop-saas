import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/api/auth";
import { recordAudit } from "@/lib/services/audit.service";
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
        const { userId } = requireAuth(request, ["ADMIN"]);
        const data = await parseJsonBody(request, systemSettingsSchema);

        const updatedSettings = await prisma.$transaction(async (tx) => {
            const settings = await tx.systemSettings.upsert({
                where: { id: "global" },
                update: data,
                create: { id: "global", ...data },
            });

            // Solo qué campos: las instrucciones de pago pueden llevar datos bancarios
            await recordAudit(tx, {
                actorId: userId,
                action: "settings_updated",
                targetType: "settings",
                metadata: { fields: Object.keys(data) },
            });

            return settings;
        });

        return NextResponse.json({ success: true, settings: updatedSettings });
    } catch (error) {
        return errorResponse(error, "Error updating settings");
    }
}

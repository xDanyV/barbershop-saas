import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET() {
    try {
        const headersList = await headers();
        const role = headersList.get("x-user-role");
        const businessId = headersList.get("x-business-id");

        if (role !== "ADMIN" && role !== "OWNER") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        if (role === "OWNER") {
            if (!businessId) {
                return NextResponse.json({ error: "Business context is required" }, { status: 403 });
            }

            let settings = await prisma.businessSettings.findUnique({
                where: { businessId },
            });

            if (!settings) {
                settings = await prisma.businessSettings.create({
                    data: {
                        businessId,
                        isServiceActive: true,
                    },
                });
            }

            return NextResponse.json(settings);
        }

        let settings = await prisma.systemSettings.findUnique({
            where: { id: "global" },
        });

        if (!settings) {
            settings = await prisma.systemSettings.create({
                data: { id: "global", isServiceActive: true },
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
        const businessId = headersList.get("x-business-id");

        if (role !== "ADMIN" && role !== "OWNER") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const { isServiceActive, maintenanceMessage } = body;

        if (role === "OWNER") {
            if (!businessId) {
                return NextResponse.json({ error: "Business context is required" }, { status: 403 });
            }

            const updatedSettings = await prisma.businessSettings.upsert({
                where: { businessId },
                update: { isServiceActive, maintenanceMessage },
                create: {
                    businessId,
                    isServiceActive,
                    maintenanceMessage,
                },
            });

            return NextResponse.json({ success: true, settings: updatedSettings });
        }

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
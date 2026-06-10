import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

function cleanString(value: unknown) {
    if (typeof value !== "string") return null;

    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : null;
}

async function getOwnerBusiness(userId: string, businessId?: string | null) {
    if (businessId) {
        return prisma.business.findFirst({
            where: {
                id: businessId,
                ownerId: userId,
            },
            include: {
                settings: true,
            },
        });
    }

    return prisma.business.findFirst({
        where: {
            ownerId: userId,
        },
        include: {
            settings: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}

export async function GET(req: NextRequest) {
    try {
        const userId = req.headers.get("x-user-id");
        const role = req.headers.get("x-user-role");
        const businessId = req.headers.get("x-business-id");

        if (!userId || !role) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (role !== "OWNER") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const business = await getOwnerBusiness(userId, businessId);

        if (!business) {
            return NextResponse.json(
                { error: "Business not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(business);
    } catch (error) {
        console.error("Get owner business error:", error);

        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const userId = req.headers.get("x-user-id");
        const role = req.headers.get("x-user-role");
        const businessId = req.headers.get("x-business-id");

        if (!userId || !role) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (role !== "OWNER") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const business = await getOwnerBusiness(userId, businessId);

        if (!business) {
            return NextResponse.json(
                { error: "Business not found" },
                { status: 404 }
            );
        }

        const body = await req.json();

        const name = cleanString(body.name);
        const description = cleanString(body.description);
        const phone = cleanString(body.phone);
        const address = cleanString(body.address);
        const logoUrl = cleanString(body.logoUrl);
        const coverUrl = cleanString(body.coverUrl);
        const maintenanceMessage =
            typeof body.maintenanceMessage === "string"
                ? body.maintenanceMessage.trim()
                : business.settings?.maintenanceMessage ?? "";

        const isServiceActive =
            typeof body.isServiceActive === "boolean"
                ? body.isServiceActive
                : business.settings?.isServiceActive ?? true;

        if (!name || name.length < 3) {
            return NextResponse.json(
                { error: "Business name must be at least 3 characters long" },
                { status: 400 }
            );
        }

        const updatedBusiness = await prisma.$transaction(async (tx) => {
            const updated = await tx.business.update({
                where: {
                    id: business.id,
                },
                data: {
                    name,
                    description,
                    phone,
                    address,
                    logoUrl,
                    coverUrl,
                },
            });

            await tx.businessSettings.upsert({
                where: {
                    businessId: business.id,
                },
                update: {
                    isServiceActive,
                    maintenanceMessage,
                },
                create: {
                    businessId: business.id,
                    isServiceActive,
                    maintenanceMessage,
                },
            });

            return tx.business.findUnique({
                where: {
                    id: updated.id,
                },
                include: {
                    settings: true,
                },
            });
        });

        return NextResponse.json(updatedBusiness);
    } catch (error) {
        console.error("Update owner business error:", error);

        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}
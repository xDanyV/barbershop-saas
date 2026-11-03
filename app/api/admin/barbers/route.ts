import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { AppError, errorResponse } from "@/lib/errors";
import { revalidateBusinessPages } from "@/lib/cache/business-pages";
import { requireAuth } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/validation";
import { updateBarberAdminSchema } from "@/lib/validations/schemas";

// ADMIN ve todos los negocios; OWNER solo el suyo
function requireBarberManager(request: NextRequest) {
    const auth = requireAuth(request, ["ADMIN", "OWNER"]);

    if (auth.role === "OWNER" && !auth.businessId) {
        throw new AppError("Business context is required", 403);
    }

    return auth;
}

export async function GET(request: NextRequest) {
    try {
        const auth = requireBarberManager(request);

        const pendingBarbers = await prisma.barber.findMany({
            where: {
                status: "PENDING",
                ...(auth.role === "OWNER" ? { businessId: auth.businessId! } : {}),
            },
            select: {
                id: true,
                userId: true,
                businessId: true,
                status: true,
                active: true,
                createdAt: true,
                profileImageUrl: true,
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(pendingBarbers);
    } catch (error) {
        return errorResponse(error, "Error fetching pending barbers");
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const auth = requireBarberManager(request);
        const { barberId, status, profileImageUrl } = await parseJsonBody(request, updateBarberAdminSchema);

        const existingBarber = await prisma.barber.findUnique({
            where: { id: barberId },
            select: { businessId: true },
        });

        if (!existingBarber) {
            throw new AppError("Barber not found", 404);
        }

        if (auth.role === "OWNER" && existingBarber.businessId !== auth.businessId) {
            throw new AppError("Forbidden", 403);
        }

        const updatedBarber = await prisma.barber.update({
            where: { id: barberId },
            data: {
                status,
                // undefined = no tocar; "" o null = quitar la foto
                ...(profileImageUrl !== undefined ? { profileImageUrl: profileImageUrl || null } : {}),
            },
            select: {
                id: true,
                status: true,
                profileImageUrl: true,
            },
        });

        await revalidateBusinessPages(existingBarber.businessId);

        return NextResponse.json({
            message: "Barber updated successfully",
            barber: updatedBarber,
        });
    } catch (error) {
        return errorResponse(error, "Error updating barber");
    }
}

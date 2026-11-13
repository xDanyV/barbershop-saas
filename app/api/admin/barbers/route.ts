import { cleanUpUploads } from "@/lib/uploads";
import { replacedUrls } from "@/lib/upload-keys";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { AppError, errorResponse } from "@/lib/errors";
import { revalidateBusinessPages } from "@/lib/cache/business-pages";
import { notifyBarberReadyLater } from "@/lib/notifications/appointments";
import { requireAuth } from "@/lib/api/auth";
import { recordAudit } from "@/lib/services/audit.service";
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
        const { barberId, status, active, profileImageUrl } = await parseJsonBody(request, updateBarberAdminSchema);

        const existingBarber = await prisma.barber.findUnique({
            where: { id: barberId },
            select: { businessId: true, userId: true, status: true, profileImageUrl: true },
        });

        if (!existingBarber) {
            throw new AppError("Barber not found", 404);
        }

        if (auth.role === "OWNER" && existingBarber.businessId !== auth.businessId) {
            throw new AppError("Forbidden", 403);
        }

        // Nadie se da de baja ni se cambia el estado a sí mismo
        if ((active !== undefined || status !== undefined) && existingBarber.userId === auth.userId) {
            throw new AppError("Not authorized", 403);
        }

        if (active !== undefined && existingBarber.status !== "APPROVED") {
            throw new AppError("Barber not found", 404);
        }

        const updatedBarber = await prisma.$transaction(async (tx) => {
            const updated = await tx.barber.update({
                where: { id: barberId },
                data: {
                    status,
                    active,
                    // undefined = no tocar; "" o null = quitar la foto
                    ...(profileImageUrl !== undefined ? { profileImageUrl: profileImageUrl || null } : {}),
                },
                select: {
                    id: true,
                    status: true,
                    active: true,
                    profileImageUrl: true,
                },
            });

            // El registro cubre a la plataforma; lo que hace un dueño en su equipo no entra
            if (auth.role === "ADMIN") {
                await recordAudit(tx, {
                    actorId: auth.userId,
                    action: "barber_updated",
                    targetType: "user",
                    targetId: existingBarber.userId,
                });
            }

            // Sus citas futuras se cancelan y el cliente lo ve en "Mis citas" como cancelada por la barbería
            const cancelled = active === false
                ? await tx.appointment.updateMany({
                    where: { barberId, status: { in: ["PENDING", "CONFIRMED"] }, date: { gt: new Date() } },
                    data: { status: "CANCELLED", cancelledBy: "BUSINESS" },
                })
                : { count: 0 };

            return { ...updated, cancelledCount: cancelled.count };
        });

        await revalidateBusinessPages(existingBarber.businessId);
        cleanUpUploads(replacedUrls([[existingBarber.profileImageUrl, profileImageUrl === undefined ? undefined : profileImageUrl || null]]));

        const { cancelledCount, ...barber } = updatedBarber;
        // Aprobado o reactivado con todo listo: ya puede recibir citas
        if (status === "APPROVED" || active === true) notifyBarberReadyLater(barberId);

        return NextResponse.json({
            message: "Barber updated successfully",
            barber,
            cancelledCount,
        });
    } catch (error) {
        return errorResponse(error, "Error updating barber");
    }
}

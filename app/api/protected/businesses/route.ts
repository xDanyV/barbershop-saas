import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Role, BarberStatus } from "@prisma/client";
import { ACTIVE_BUSINESS_COOKIE, sessionCookieOptions } from "@/lib/auth/session";
import { AppError, errorResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/validation";
import { createBusinessSchema } from "@/lib/validations/schemas";
import { generateUniqueBusinessSlug } from "@/lib/slug";

export async function GET(req: NextRequest) {
    try {
        const { userId } = requireAuth(req);

        const businesses = await prisma.business.findMany({
            where: { ownerId: userId },
            include: {
                settings: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(businesses);
    } catch (error) {
        return errorResponse(error, "Get businesses error");
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = requireAuth(req);
        const data = await parseJsonBody(req, createBusinessSchema);

        // Un barbero vinculado a otro negocio no podría gestionar el suyo (su perfil de barbero es único)
        if (auth.role === Role.BARBER) {
            throw new AppError("Barbers linked to another business cannot create a business", 409);
        }

        const user = await prisma.user.findUniqueOrThrow({
            where: { id: auth.userId },
            select: {
                id: true,
                role: true,
                barberProfile: { select: { id: true } },
            },
        });

        const slug = await generateUniqueBusinessSlug(data.name);

        const business = await prisma.$transaction(async (tx) => {
            const newBusiness = await tx.business.create({
                data: {
                    ...data,
                    slug,
                    ownerId: user.id,
                    // Toda suscripción nace con los valores por defecto (plan BASIC, estado ACTIVE)
                    subscription: {
                        create: {
                            currentPeriodStart: new Date(),
                        },
                    },
                    settings: {
                        create: {},
                    },
                },
                include: {
                    settings: true,
                },
            });

            if (user.role === Role.CUSTOMER) {
                await tx.user.update({
                    where: { id: user.id },
                    data: { role: Role.OWNER },
                });
            }

            if (!user.barberProfile) {
                await tx.barber.create({
                    data: {
                        userId: user.id,
                        businessId: newBusiness.id,
                        status: BarberStatus.APPROVED,
                    },
                });
            }

            return newBusiness;
        });

        const response = NextResponse.json(
            {
                message: "Business created successfully",
                business,
            },
            { status: 201 }
        );

        // La sesión se recarga en cada petición: el nuevo negocio queda activo sin volver a iniciar sesión
        response.cookies.set(ACTIVE_BUSINESS_COOKIE, business.id, {
            ...sessionCookieOptions,
            maxAge: 60 * 60 * 24 * 365,
        });

        return response;
    } catch (error) {
        return errorResponse(error, "Create business error");
    }
}

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { BarberStatus, Role } from "@prisma/client";
import { AppError, errorResponse } from "@/lib/errors";
import { parseJsonBody } from "@/lib/api/validation";
import { registerSchema } from "@/lib/validations/schemas";
import { extractBusinessSlug } from "@/lib/slug";
import { TERMS_VERSION } from "@/lib/legal";

function getBootstrapAdminEmail() {
    return process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase() || null;
}

export async function POST(req: Request) {
    try {
        const { name, email, phone, password, role, businessSlug } = await parseJsonBody(req, registerSchema);

        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { phone }],
            },
            select: { email: true, phone: true },
        });

        if (existingUser?.email === email) {
            throw new AppError("This email address is already registered.");
        }

        if (existingUser?.phone === phone) {
            throw new AppError("This phone number is already registered.");
        }

        // El administrador de la plataforma solo se crea a partir de ADMIN_BOOTSTRAP_EMAIL,
        // y únicamente mientras no exista ningún ADMIN
        const isBootstrapAdmin =
            email === getBootstrapAdminEmail() &&
            (await prisma.user.count({ where: { role: Role.ADMIN } })) === 0;

        let barberBusinessId: string | null = null;

        if (!isBootstrapAdmin && role === Role.BARBER) {
            const slug = businessSlug ? extractBusinessSlug(businessSlug) : "";

            if (!slug) {
                throw new AppError("Business slug is required for barber accounts.");
            }

            const business = await prisma.business.findUnique({
                where: { slug },
                select: { id: true, active: true },
            });

            if (!business || !business.active) {
                throw new AppError("Business not found or inactive.", 404);
            }

            barberBusinessId = business.id;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const finalRole = isBootstrapAdmin ? Role.ADMIN : role;

        await prisma.user.create({
            data: {
                name,
                email,
                phone,
                password: hashedPassword,
                role: finalRole,
                termsVersion: TERMS_VERSION,
                termsAcceptedAt: new Date(),
                ...(finalRole === Role.BARBER && barberBusinessId
                    ? {
                        barberProfile: {
                            create: {
                                businessId: barberBusinessId,
                                status: BarberStatus.PENDING,
                            },
                        },
                    }
                    : {}),
            },
        });

        return NextResponse.json(
            {
                message:
                    finalRole === Role.BARBER
                        ? "Barber account created successfully. Waiting for owner approval."
                        : "User created successfully",
            },
            { status: 201 }
        );
    } catch (error) {
        return errorResponse(error, "Registration route error");
    }
}

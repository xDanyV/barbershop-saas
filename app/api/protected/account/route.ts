import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { AppError, errorResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/validation";
import { deleteAccountSchema, updateProfileSchema } from "@/lib/validations/schemas";
import { RATE_LIMITS, consumeRateLimit } from "@/lib/rate-limit";
import {
    ACTIVE_BUSINESS_COOKIE,
    MANAGED_BARBER_COOKIE,
    SESSION_COOKIE,
    sessionCookieOptions,
} from "@/lib/auth/session";

// Corregir nombre y teléfono (derecho de rectificación)
export async function PATCH(request: NextRequest) {
    try {
        const { userId } = requireAuth(request);
        const { name, phone } = await parseJsonBody(request, updateProfileSchema);

        const phoneOwner = await prisma.user.findFirst({
            where: { phone, id: { not: userId } },
            select: { id: true },
        });

        if (phoneOwner) {
            throw new AppError("This phone number is already registered.", 409);
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: { name, phone },
            select: { name: true, email: true, phone: true },
        });

        return NextResponse.json(user);
    } catch (error) {
        return errorResponse(error, "Update profile error");
    }
}

// Eliminar la cuenta (derecho de cancelación). Solo clientes: las cuentas de barberos y dueños
// tienen citas y negocios que dependen de ellas y se eliminan con apoyo.
export async function DELETE(request: NextRequest) {
    try {
        const { userId, role } = requireAuth(request);

        if (role !== "CUSTOMER") {
            throw new AppError("Business accounts are deleted with support", 403);
        }

        await consumeRateLimit(`password:user:${userId}`, RATE_LIMITS.passwordUser);
        const { password } = await parseJsonBody(request, deleteAccountSchema);

        const user = await prisma.user.findUniqueOrThrow({
            where: { id: userId },
            select: { password: true },
        });

        if (!(await bcrypt.compare(password, user.password))) {
            throw new AppError("Your password is not correct.", 403);
        }

        const unusablePassword = await bcrypt.hash(randomBytes(32).toString("hex"), 10);

        await prisma.$transaction([
            // Las citas próximas se liberan para la barbería
            prisma.appointment.updateMany({
                where: {
                    userId,
                    status: { in: ["PENDING", "CONFIRMED"] },
                    date: { gt: new Date() },
                },
                data: { status: "CANCELLED", cancelledBy: "CUSTOMER" },
            }),
            // Se borran los datos que identifican a la persona; el historial queda anónimo
            prisma.user.update({
                where: { id: userId },
                data: {
                    name: null,
                    email: `deleted+${userId}@deleted.invalid`,
                    phone: `deleted-${userId}`,
                    password: unusablePassword,
                    deletedAt: new Date(),
                },
            }),
        ]);

        const response = NextResponse.json({ deleted: true });
        response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions, expires: new Date(0) });
        response.cookies.delete(ACTIVE_BUSINESS_COOKIE);
        response.cookies.delete(MANAGED_BARBER_COOKIE);

        return response;
    } catch (error) {
        return errorResponse(error, "Delete account error");
    }
}

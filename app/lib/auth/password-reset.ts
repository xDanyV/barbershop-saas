import { createHash, randomBytes } from "crypto";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

// Recuperación de contraseña sin correo ni SMS: el dueño (para su equipo) o el administrador
// genera un enlace de un solo uso y se lo comparte a la persona, por ejemplo por WhatsApp.
// Cuando haya correo, el mismo enlace se podrá enviar desde "¿Olvidaste tu contraseña?".

export const RESET_LINK_HOURS = 24;

export function hashResetToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
}

export function resetLinkPath(locale: string, token: string) {
    return `/${locale}/reset-password?token=${token}`;
}

// Crea un enlace nuevo y anula los anteriores que no se usaron
export async function createPasswordResetToken(userId: string, createdById: string) {
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + RESET_LINK_HOURS * 60 * 60 * 1000);

    await prisma.$transaction([
        prisma.passwordResetToken.deleteMany({ where: { userId, usedAt: null } }),
        prisma.passwordResetToken.create({
            data: { tokenHash: hashResetToken(token), userId, createdById, expiresAt },
        }),
    ]);

    return { token, expiresAt };
}

// El enlace sirve si existe, no se ha usado, no ha vencido y la cuenta sigue activa
export async function findUsableResetToken(token: string) {
    if (!token) return null;

    const record = await prisma.passwordResetToken.findUnique({
        where: { tokenHash: hashResetToken(token) },
        select: {
            id: true,
            userId: true,
            expiresAt: true,
            usedAt: true,
            user: { select: { name: true, email: true, deletedAt: true } },
        },
    });

    if (!record || record.usedAt || record.expiresAt <= new Date() || record.user.deletedAt) return null;

    return record;
}

// Cambia la contraseña y cierra las sesiones abiertas; el enlace deja de servir
export async function resetPasswordWithToken(token: string, newPassword: string) {
    const record = await findUsableResetToken(token);

    if (!record) {
        throw new AppError("This link is no longer valid.", 410, "RESET_LINK_INVALID");
    }

    const password = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction(async (tx) => {
        // Si dos pestañas lo usan a la vez, solo una lo consigue
        const claimed = await tx.passwordResetToken.updateMany({
            where: { id: record.id, usedAt: null },
            data: { usedAt: new Date() },
        });

        if (claimed.count !== 1) {
            throw new AppError("This link is no longer valid.", 410, "RESET_LINK_INVALID");
        }

        await tx.user.update({
            where: { id: record.userId },
            data: { password, sessionVersion: { increment: 1 } },
        });

        await tx.passwordResetToken.deleteMany({ where: { userId: record.userId, usedAt: null } });
    });

    return { email: record.user.email };
}

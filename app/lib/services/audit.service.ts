import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type AuditAction =
    | "payment_recorded"
    | "payment_voided"
    | "membership_adjusted"
    | "settings_updated"
    | "customer_banned"
    | "customer_unbanned"
    | "barber_updated"
    | "business_activated"
    | "business_deactivated";

type AuditEntry = {
    actorId: string;
    action: AuditAction;
    targetType: "business" | "user" | "settings";
    targetId?: string;
    // Solo el nombre de un negocio. De una persona se guarda el id: si elimina su cuenta, el registro queda anónimo.
    targetLabel?: string;
    metadata?: Prisma.InputJsonValue;
};

// Se llama dentro de la transacción de la acción: o quedan las dos cosas o ninguna
export function recordAudit(tx: Prisma.TransactionClient, entry: AuditEntry) {
    return tx.auditLog.create({ data: entry });
}

const PAGE_SIZE = 50;

export async function listAuditLog(cursor?: string | null) {
    const rows = await prisma.auditLog.findMany({
        take: PAGE_SIZE + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: {
            id: true,
            action: true,
            targetType: true,
            targetId: true,
            targetLabel: true,
            metadata: true,
            createdAt: true,
            actor: { select: { name: true, email: true } },
        },
    });

    const page = rows.slice(0, PAGE_SIZE);

    // Nombre actual de las personas: una cuenta eliminada ya no tiene nombre
    const userIds = page.filter((row) => row.targetType === "user" && row.targetId).map((row) => row.targetId!);
    const users = userIds.length
        ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } })
        : [];
    const names = new Map(users.map((user) => [user.id, user.name]));

    return {
        entries: page.map(({ actor, ...row }) => ({
            ...row,
            actorName: actor ? actor.name || actor.email : null,
            targetLabel: row.targetType === "user" ? names.get(row.targetId ?? "") ?? null : row.targetLabel,
        })),
        nextCursor: rows.length > PAGE_SIZE ? page[page.length - 1].id : null,
    };
}

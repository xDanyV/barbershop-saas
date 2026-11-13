import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/api/auth";
import { renderNotification, type NotificationData, type NotificationEvent } from "@/lib/notifications/appointments";

const PAGE = 20;

// Bandeja de avisos: los más recientes primero, ya escritos en el idioma de la pantalla.
// ?count=1 solo devuelve cuántos faltan por leer (para el punto de la campana).
export async function GET(request: NextRequest) {
    try {
        const { userId } = requireAuth(request);
        const params = request.nextUrl.searchParams;
        const unread = await prisma.notification.count({ where: { userId, readAt: null } });

        if (params.get("count") === "1") return NextResponse.json({ unread });

        const locale = params.get("locale") === "en" ? "en" : "es";
        const cursor = params.get("cursor");
        const rows = await prisma.notification.findMany({
            where: { userId },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            take: PAGE + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        });

        const items = rows.slice(0, PAGE).map((row) => ({
            id: row.id,
            event: row.event,
            ...renderNotification(row.event as NotificationEvent, row.data as NotificationData, locale),
            url: `/${locale}${row.url}`,
            read: row.readAt !== null,
            createdAt: row.createdAt,
        }));

        return NextResponse.json({ items, unread, nextCursor: rows.length > PAGE ? rows[PAGE - 1].id : null });
    } catch (error) {
        return errorResponse(error, "Get notifications error");
    }
}

// Abrir la bandeja marca todo como leído
export async function POST(request: NextRequest) {
    try {
        const { userId } = requireAuth(request);
        const { count } = await prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });

        return NextResponse.json({ marked: count });
    } catch (error) {
        return errorResponse(error, "Mark notifications read error");
    }
}

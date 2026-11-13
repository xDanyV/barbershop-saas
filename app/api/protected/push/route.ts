import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { AppError, errorResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/validation";
import { pushPublicKey } from "@/lib/push";

const subscribeSchema = z.object({
    endpoint: z.string().url().max(2048).refine((url) => url.startsWith("https://"), "must be https"),
    keys: z.object({ p256dh: z.string().min(1).max(256), auth: z.string().min(1).max(128) }),
    locale: z.enum(["es", "en"]).default("es"),
});

const unsubscribeSchema = z.object({ endpoint: z.string().min(1).max(2048) });

// Llave pública para que el navegador pueda suscribirse; null si los avisos no están configurados
export async function GET(request: NextRequest) {
    try {
        const { userId } = requireAuth(request);
        const count = await prisma.pushSubscription.count({ where: { userId } });

        return NextResponse.json({ publicKey: pushPublicKey(), devices: count });
    } catch (error) {
        return errorResponse(error, "Get push key error");
    }
}

// Este dispositivo acepta avisos. Si el mismo endpoint era de otra cuenta, pasa a la actual
export async function POST(request: NextRequest) {
    try {
        const { userId } = requireAuth(request);
        if (!pushPublicKey()) throw new AppError("Notifications are not available", 503);

        const { endpoint, keys, locale } = await parseJsonBody(request, subscribeSchema);

        await prisma.pushSubscription.upsert({
            where: { endpoint },
            update: { userId, p256dh: keys.p256dh, auth: keys.auth, locale },
            create: { userId, endpoint, p256dh: keys.p256dh, auth: keys.auth, locale },
        });

        return NextResponse.json({ subscribed: true });
    } catch (error) {
        return errorResponse(error, "Push subscribe error");
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { userId } = requireAuth(request);
        const { endpoint } = await parseJsonBody(request, unsubscribeSchema);

        await prisma.pushSubscription.deleteMany({ where: { userId, endpoint } });

        return NextResponse.json({ subscribed: false });
    } catch (error) {
        return errorResponse(error, "Push unsubscribe error");
    }
}

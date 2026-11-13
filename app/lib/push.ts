import webpush from "web-push";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site";

// Avisos push sin servicios de pago: el navegador de cada dispositivo los entrega (Web Push + VAPID).
// Sin llaves configuradas no se envía nada y la app funciona igual.

export type PushMessage = {
    title: string;
    body: string;
    // Ruta que se abre al tocar el aviso
    url: string;
    // Avisos con la misma etiqueta se reemplazan en vez de amontonarse
    tag?: string;
};

let configured: boolean | null = null;

// Solo si el envío está bien configurado: así nadie activa avisos que nunca llegarían
export function pushPublicKey() {
    return configure() ? process.env.VAPID_PUBLIC_KEY! : null;
}

function configure() {
    if (configured !== null) return configured;

    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    // El "subject" identifica al remitente ante el servicio push: una URL https o un mailto
    const subject = process.env.VAPID_SUBJECT || getSiteUrl();

    if (!publicKey || !privateKey || !/^(https:|mailto:)/.test(subject)) {
        if (publicKey && privateKey) console.warn("Push disabled: VAPID_SUBJECT must be an https: or mailto: URL");
        configured = false;
        return configured;
    }

    try {
        webpush.setVapidDetails(subject, publicKey, privateKey);
        configured = true;
    } catch (error) {
        console.error("Push disabled: invalid VAPID keys", error);
        configured = false;
    }

    return configured;
}

type Subscription = { id: string; endpoint: string; p256dh: string; auth: string; locale: string };

// Envía a cada dispositivo de la persona el mensaje en su idioma; borra los que ya no existen
export async function sendPush(userId: string, build: (locale: string) => PushMessage) {
    if (!configure()) return { sent: 0 };

    const subscriptions: Subscription[] = await prisma.pushSubscription.findMany({
        where: { userId },
        select: { id: true, endpoint: true, p256dh: true, auth: true, locale: true },
    });

    let sent = 0;
    const gone: string[] = [];

    await Promise.all(
        subscriptions.map(async (subscription) => {
            try {
                await webpush.sendNotification(
                    { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
                    JSON.stringify(build(subscription.locale)),
                    { TTL: 60 * 60 * 12, urgency: "high" }
                );
                sent++;
            } catch (error) {
                const status = (error as { statusCode?: number }).statusCode;
                // 404/410: el permiso se retiró o la app se desinstaló
                if (status === 404 || status === 410) gone.push(subscription.id);
                else console.error("Push send error:", status ?? error);
            }
        })
    );

    if (gone.length) await prisma.pushSubscription.deleteMany({ where: { id: { in: gone } } });

    return { sent };
}

// Se envía después de responder: un aviso lento nunca retrasa ni rompe la acción del usuario
export function sendPushLater(task: () => Promise<unknown>) {
    const run = () => task().catch((error) => console.error("Push task error:", error));

    try {
        after(run);
    } catch {
        // Fuera de una petición (scripts, cron): se ejecuta en el momento
        void run();
    }
}

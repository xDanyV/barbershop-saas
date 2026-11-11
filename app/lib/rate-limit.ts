import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

// Límite de intentos con ventana fija guardado en Postgres (sin servicios externos).
// Un solo UPSERT atómico incrementa el contador o reinicia la ventana si ya venció.

type Rule = { limit: number; windowSeconds: number };

export const RATE_LIMITS = {
    loginIp: { limit: 20, windowSeconds: 15 * 60 },
    loginEmail: { limit: 5, windowSeconds: 15 * 60 },
    registerIp: { limit: 5, windowSeconds: 60 * 60 },
    bookingUser: { limit: 10, windowSeconds: 60 * 60 },
    passwordUser: { limit: 5, windowSeconds: 15 * 60 },
    passwordResetIp: { limit: 10, windowSeconds: 15 * 60 },
} satisfies Record<string, Rule>;

type Hit = { count: number; windowStart: Date };

async function hit(key: string, windowSeconds: number): Promise<Hit> {
    const rows = await prisma.$queryRaw<Hit[]>`
        INSERT INTO "RateLimit" ("key", "count", "windowStart")
        VALUES (${key}, 1, NOW())
        ON CONFLICT ("key") DO UPDATE SET
            "count" = CASE
                WHEN "RateLimit"."windowStart" < NOW() - make_interval(secs => ${windowSeconds}) THEN 1
                ELSE "RateLimit"."count" + 1
            END,
            "windowStart" = CASE
                WHEN "RateLimit"."windowStart" < NOW() - make_interval(secs => ${windowSeconds}) THEN NOW()
                ELSE "RateLimit"."windowStart"
            END
        RETURNING "count", "windowStart"`;

    return rows[0];
}

function retryAfterSeconds(windowStart: Date, windowSeconds: number) {
    const remaining = windowStart.getTime() + windowSeconds * 1000 - Date.now();
    return Math.max(1, Math.ceil(remaining / 1000));
}

// Suma un intento y lanza 429 si se pasó del límite
export async function consumeRateLimit(key: string, rule: Rule) {
    const { count, windowStart } = await hit(key, rule.windowSeconds);

    if (count > rule.limit) {
        throw new RateLimitError(retryAfterSeconds(windowStart, rule.windowSeconds));
    }
}

// Suma un intento sin bloquear (p. ej. una contraseña incorrecta); el bloqueo lo decide assertNotRateLimited
export async function recordRateLimitHit(key: string, rule: Rule) {
    await hit(key, rule.windowSeconds);
}

// Solo consulta (no suma): para bloquear antes de comprobar una contraseña
export async function assertNotRateLimited(key: string, rule: Rule) {
    const row = await prisma.rateLimit.findUnique({ where: { key } });
    if (!row) return;

    const expired = row.windowStart.getTime() + rule.windowSeconds * 1000 < Date.now();
    if (!expired && row.count >= rule.limit) {
        throw new RateLimitError(retryAfterSeconds(row.windowStart, rule.windowSeconds));
    }
}

export async function resetRateLimit(key: string) {
    await prisma.rateLimit.deleteMany({ where: { key } });
}

export class RateLimitError extends AppError {
    constructor(public retryAfter: number) {
        super("Too many attempts. Please try again later.", 429);
        this.name = "RateLimitError";
    }
}

// IP del cliente según Vercel (x-forwarded-for la fija la plataforma, no el navegador)
export function getClientIp(request: Request) {
    return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

// Limpieza de ventanas vencidas (cron diario)
export async function purgeExpiredRateLimits(now = new Date()) {
    const longestWindow = Math.max(...Object.values(RATE_LIMITS).map((rule) => rule.windowSeconds));
    const { count } = await prisma.rateLimit.deleteMany({
        where: { windowStart: { lt: new Date(now.getTime() - longestWindow * 1000) } },
    });
    return { purged: count };
}

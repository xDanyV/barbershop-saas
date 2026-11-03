// Utilidades de fecha/hora en la zona horaria del negocio (sin dependencias externas).
// Las fechas se guardan en UTC; los horarios del barbero ("HH:mm") son hora local del negocio.

export const DEFAULT_TIMEZONE = "America/Mexico_City";

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function resolveTimezone(timezone?: string | null) {
    if (!timezone) return DEFAULT_TIMEZONE;

    try {
        new Intl.DateTimeFormat("en-US", { timeZone: timezone });
        return timezone;
    } catch {
        return DEFAULT_TIMEZONE;
    }
}

export function isValidTime(value: unknown): value is string {
    return typeof value === "string" && TIME_REGEX.test(value);
}

export function isValidDateKey(value: unknown): value is string {
    if (typeof value !== "string" || !DATE_KEY_REGEX.test(value)) return false;

    const [y, m, d] = value.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));

    return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export function timeToMinutes(value: string) {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
}

type ZonedParts = {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
};

export function getZonedParts(date: Date, timezone: string): ZonedParts {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hourCycle: "h23",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).formatToParts(date);

    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);

    return {
        year: get("year"),
        month: get("month"),
        day: get("day"),
        hour: get("hour"),
        minute: get("minute"),
    };
}

function getOffsetMs(date: Date, timezone: string) {
    const p = getZonedParts(date, timezone);
    const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
    const truncated = Math.floor(date.getTime() / 60000) * 60000;

    return asUtc - truncated;
}

// "2026-11-03" + "09:00" en la zona del negocio -> instante UTC
export function zonedToUtc(dateKey: string, time: string, timezone: string) {
    const [y, m, d] = dateKey.split("-").map(Number);
    const [hh, mm] = time.split(":").map(Number);
    const guess = Date.UTC(y, m - 1, d, hh, mm);

    // Dos pasadas para cubrir cambios de horario de verano
    let result = guess - getOffsetMs(new Date(guess), timezone);
    result = guess - getOffsetMs(new Date(result), timezone);

    return new Date(result);
}

// Instante UTC -> "YYYY-MM-DD" en la zona del negocio
export function toDateKey(date: Date, timezone: string) {
    const p = getZonedParts(date, timezone);
    return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

// Minutos desde medianoche en la zona del negocio
export function minutesOfDay(date: Date, timezone: string) {
    const p = getZonedParts(date, timezone);
    return p.hour * 60 + p.minute;
}

// 0 = domingo ... 6 = sábado, igual que Availability.dayOfWeek
export function dayOfWeekFromKey(dateKey: string) {
    const [y, m, d] = dateKey.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function addDaysToKey(dateKey: string, days: number) {
    const [y, m, d] = dateKey.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d + days));
    return date.toISOString().slice(0, 10);
}

export function formatMinutes12h(totalMinutes: number) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;

    return `${String(hours12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`;
}

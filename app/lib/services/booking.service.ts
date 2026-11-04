import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
    addDaysToKey,
    dayOfWeekFromKey,
    formatMinutes12h,
    minutesOfDay,
    resolveTimezone,
    zonedToUtc,
} from "@/lib/time/zoned";

// Los huecos se generan cada media hora a partir de la hora de inicio del barbero
export const SLOT_MINUTES = 30;

// Una cita cancelada sigue bloqueando su hueco si faltan menos de 2 horas
const CANCELLED_BLOCK_MS = 2 * 60 * 60 * 1000;

const MINUTE_MS = 60 * 1000;

type Db = Prisma.TransactionClient | typeof prisma;

export type DaySchedule = {
    startTime: string;
    endTime: string;
    breakStart: string | null;
    breakEnd: string | null;
};

export type BusyInterval = {
    start: number;
    end: number;
};

export type Slot = {
    start: Date;
    label: string;
    // Minutos libres desde el inicio del hueco hasta el siguiente bloqueo
    maxMinutes: number;
};

// Cálculo puro: huecos libres de un día dados el horario y los intervalos ocupados (ms UTC)
export function computeDaySlots(params: {
    dateKey: string;
    timezone: string;
    schedule: DaySchedule;
    busy: BusyInterval[];
    now: number;
}): Slot[] {
    const { dateKey, timezone, schedule, busy, now } = params;

    const dayStart = zonedToUtc(dateKey, schedule.startTime, timezone).getTime();
    const dayEnd = zonedToUtc(dateKey, schedule.endTime, timezone).getTime();

    const blocks = [...busy];

    if (schedule.breakStart && schedule.breakEnd) {
        blocks.push({
            start: zonedToUtc(dateKey, schedule.breakStart, timezone).getTime(),
            end: zonedToUtc(dateKey, schedule.breakEnd, timezone).getTime(),
        });
    }

    const slots: Slot[] = [];

    for (let start = dayStart; start < dayEnd; start += SLOT_MINUTES * MINUTE_MS) {
        if (start <= now) continue;

        const isBlocked = blocks.some((b) => b.start <= start && start < b.end);
        if (isBlocked) continue;

        const nextBlockStart = blocks
            .filter((b) => b.start > start)
            .reduce((min, b) => Math.min(min, b.start), dayEnd);

        slots.push({
            start: new Date(start),
            label: formatMinutes12h(minutesOfDay(new Date(start), timezone)),
            maxMinutes: Math.floor((nextBlockStart - start) / MINUTE_MS),
        });
    }

    return slots;
}

export type BarberDay = {
    timezone: string;
    schedule: DaySchedule | null;
    slots: Slot[];
};

// Carga horario, citas y excepciones del barbero para un día ("YYYY-MM-DD" en la zona del negocio)
export async function getBarberDay(
    db: Db,
    barberId: string,
    dateKey: string,
    timezoneInput?: string | null,
    options?: { excludeAppointmentId?: string }
): Promise<BarberDay> {
    const timezone = resolveTimezone(timezoneInput);
    const dayOfWeek = dayOfWeekFromKey(dateKey);

    const schedule = await db.availability.findFirst({
        where: { barberId, dayOfWeek },
        select: {
            startTime: true,
            endTime: true,
            breakStart: true,
            breakEnd: true,
        },
    });

    if (!schedule) {
        return { timezone, schedule: null, slots: [] };
    }

    const windowStart = zonedToUtc(dateKey, "00:00", timezone);
    const windowEnd = zonedToUtc(addDaysToKey(dateKey, 1), "00:00", timezone);
    const now = Date.now();

    const [appointments, exceptions] = await Promise.all([
        db.appointment.findMany({
            where: {
                barberId,
                // Al reagendar, la cita que se mueve no ocupa su propio horario
                ...(options?.excludeAppointmentId ? { id: { not: options.excludeAppointmentId } } : {}),
                status: { in: ["PENDING", "CONFIRMED", "CANCELLED"] },
                // Margen hacia atrás para citas largas que empiezan el día anterior
                date: {
                    gte: new Date(windowStart.getTime() - 12 * 60 * MINUTE_MS),
                    lt: windowEnd,
                },
            },
            select: {
                date: true,
                status: true,
                service: { select: { duration: true } },
            },
        }),
        db.barberException.findMany({
            where: {
                barberId,
                startDate: { lt: windowEnd },
                endDate: { gte: windowStart },
            },
            select: { startDate: true, endDate: true },
        }),
    ]);

    const busy: BusyInterval[] = [
        ...appointments
            .filter(
                (a) =>
                    a.status !== "CANCELLED" ||
                    a.date.getTime() - now < CANCELLED_BLOCK_MS
            )
            .map((a) => ({
                start: a.date.getTime(),
                end: a.date.getTime() + a.service.duration * MINUTE_MS,
            })),
        ...exceptions.map((e) => ({
            start: e.startDate.getTime(),
            end: e.endDate.getTime() + 1,
        })),
    ];

    return {
        timezone,
        schedule,
        slots: computeDaySlots({ dateKey, timezone, schedule, busy, now }),
    };
}

// Cálculo puro: ¿el intervalo [start, end) se cruza con alguno de los ocupados?
export function overlapsBusy(start: number, end: number, busy: BusyInterval[]) {
    return busy.some((b) => start < b.end && b.start < end);
}

// Para citas manuales: el barbero puede salirse de su horario, pero no empalmar citas ni usar un día libre
export async function hasScheduleConflict(db: Db, barberId: string, start: Date, durationMinutes: number) {
    const startMs = start.getTime();
    const endMs = startMs + durationMinutes * MINUTE_MS;
    const end = new Date(endMs);

    const [appointments, exceptions] = await Promise.all([
        db.appointment.findMany({
            where: {
                barberId,
                status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] },
                date: { gte: new Date(startMs - 12 * 60 * MINUTE_MS), lt: end },
            },
            select: { date: true, service: { select: { duration: true } } },
        }),
        db.barberException.findMany({
            where: { barberId, startDate: { lt: end }, endDate: { gte: start } },
            select: { id: true },
        }),
    ]);

    if (exceptions.length > 0) return true;

    return overlapsBusy(
        startMs,
        endMs,
        appointments.map((a) => ({
            start: a.date.getTime(),
            end: a.date.getTime() + a.service.duration * MINUTE_MS,
        }))
    );
}

// Advisory locks de Postgres liberados al terminar la transacción.
// Serializan reservas concurrentes sobre la misma clave (barbero, cliente). Tomar siempre en el mismo orden.
export async function lockKeys(tx: Prisma.TransactionClient, ...keys: string[]) {
    for (const key of keys) {
        await tx.$queryRaw`SELECT 1 AS locked FROM (SELECT pg_advisory_xact_lock(hashtext(${key}))) AS l`;
    }
}

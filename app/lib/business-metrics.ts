import type { AppointmentStatus } from "@prisma/client";
import { addDaysToKey, addMonthsToKey, toDateKey } from "@/lib/time/zoned";

export type MetricsRow = {
    date: Date;
    status: AppointmentStatus;
    userId: string | null;
    walkInName: string | null;
    barberId: string;
    barberName: string | null;
    serviceName: string;
    priceCents: number;
};

export type RankedItem = { key: string; label: string | null; count: number };

const DAY_MS = 24 * 60 * 60 * 1000;

function rank(entries: { key: string; label: string | null }[], limit: number): RankedItem[] {
    const totals = new Map<string, RankedItem>();

    for (const { key, label } of entries) {
        const current = totals.get(key);
        totals.set(key, { key, label, count: (current?.count ?? 0) + 1 });
    }

    return [...totals.values()].sort((a, b) => b.count - a.count || (a.label ?? "").localeCompare(b.label ?? "")).slice(0, limit);
}

// Cálculo puro sobre las citas del negocio. "Atendida" es una cita ya pasada, confirmada o completada:
// el cron solo la marca COMPLETED una vez al día, y un no-show deja de contar.
export function computeOwnerMetrics(rows: MetricsRow[], now: Date, timezone: string) {
    const nowMs = now.getTime();
    const todayKey = toDateKey(now, timezone);
    const monthPrefix = todayKey.slice(0, 7);
    const samePointLastMonthKey = addMonthsToKey(todayKey, -1);
    const lastMonthPrefix = samePointLastMonthKey.slice(0, 7);
    const nextWeekKey = addDaysToKey(todayKey, 7);
    const last30Start = nowMs - 30 * DAY_MS;

    const keyed = rows.map((row) => ({ ...row, key: toDateKey(row.date, timezone), ms: row.date.getTime() }));

    const isOpen = (status: AppointmentStatus) => status === "PENDING" || status === "CONFIRMED";
    const attended = keyed.filter((row) => row.ms < nowMs && (row.status === "COMPLETED" || row.status === "CONFIRMED"));

    const thisMonth = attended.filter((row) => row.key.startsWith(monthPrefix));
    const lastMonth = attended.filter((row) => row.key.startsWith(lastMonthPrefix) && row.key <= samePointLastMonthKey);
    const income = (list: { priceCents: number }[]) => list.reduce((sum, row) => sum + row.priceCents, 0);

    const attendedLast30 = attended.filter((row) => row.ms >= last30Start).length;
    const noShowsLast30 = keyed.filter((row) => row.status === "NO_SHOW" && row.ms >= last30Start).length;
    const decided = attendedLast30 + noShowsLast30;

    const customers = new Set(thisMonth.map((row) => row.userId ?? `walk-in:${(row.walkInName ?? "").trim().toLowerCase()}`));

    return {
        today: keyed.filter((row) => row.key === todayKey && (isOpen(row.status) || row.status === "COMPLETED")).length,
        nextSevenDays: keyed.filter((row) => row.key > todayKey && row.key <= nextWeekKey && isOpen(row.status)).length,
        pendingToConfirm: keyed.filter((row) => row.status === "PENDING" && row.ms >= nowMs).length,
        month: {
            attended: thisMonth.length,
            incomeCents: income(thisMonth),
            customers: customers.size,
            previousAttended: lastMonth.length,
            previousIncomeCents: income(lastMonth),
        },
        noShows: {
            count: noShowsLast30,
            // Sin citas no hay tasa: mostrar 0 % haría creer que se midió algo
            percent: decided > 0 ? Math.round((noShowsLast30 / decided) * 100) : null,
        },
        topServices: rank(thisMonth.map((row) => ({ key: row.serviceName, label: row.serviceName })), 5),
        byBarber: rank(thisMonth.map((row) => ({ key: row.barberId, label: row.barberName })), 8),
    };
}

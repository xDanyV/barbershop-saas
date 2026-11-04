import { describe, expect, it } from "vitest";
import type { AppointmentStatus } from "@prisma/client";
import { computeOwnerMetrics, type MetricsRow } from "@/lib/business-metrics";
import { zonedToUtc } from "@/lib/time/zoned";

const TZ = "America/Tijuana";
const now = zonedToUtc("2026-11-16", "12:00", TZ);

function row(dateKey: string, time: string, status: AppointmentStatus, extra: Partial<MetricsRow> = {}): MetricsRow {
    return {
        date: zonedToUtc(dateKey, time, TZ),
        status,
        userId: "customer-1",
        walkInName: null,
        barberId: "barber-1",
        barberName: "Luis",
        serviceName: "Corte",
        priceCents: 15000,
        ...extra,
    };
}

describe("computeOwnerMetrics", () => {
    it("handles a business with no appointments", () => {
        const metrics = computeOwnerMetrics([], now, TZ);

        expect(metrics.today).toBe(0);
        expect(metrics.month.attended).toBe(0);
        expect(metrics.noShows.percent).toBeNull();
        expect(metrics.topServices).toEqual([]);
    });

    it("counts today's and next week's appointments using the local day", () => {
        const metrics = computeOwnerMetrics(
            [
                row("2026-11-16", "09:00", "COMPLETED"),
                row("2026-11-16", "18:00", "PENDING"),
                row("2026-11-16", "20:00", "CONFIRMED"), // ya es 17 en UTC
                row("2026-11-17", "09:00", "CONFIRMED"),
                row("2026-11-23", "09:00", "PENDING"),
                row("2026-11-24", "09:00", "CONFIRMED"), // fuera de los 7 días
            ],
            now,
            TZ
        );

        expect(metrics.today).toBe(3);
        expect(metrics.nextSevenDays).toBe(2);
        expect(metrics.pendingToConfirm).toBe(2);
    });

    it("only counts past confirmed or completed appointments as attended", () => {
        const { month } = computeOwnerMetrics(
            [
                row("2026-11-02", "10:00", "COMPLETED"),
                row("2026-11-16", "10:00", "CONFIRMED"), // el cron aún no la cierra
                row("2026-11-16", "18:00", "CONFIRMED"), // todavía no ocurre
                row("2026-11-03", "10:00", "NO_SHOW"),
                row("2026-11-01", "10:00", "PENDING"),
            ],
            now,
            TZ
        );

        expect(month.attended).toBe(2);
        expect(month.incomeCents).toBe(30000);
    });

    it("compares with the same point of last month, not the whole month", () => {
        const { month } = computeOwnerMetrics(
            [
                row("2026-10-16", "10:00", "COMPLETED"),
                row("2026-10-17", "10:00", "COMPLETED"),
                row("2026-09-30", "10:00", "COMPLETED"),
            ],
            now,
            TZ
        );

        expect(month.previousAttended).toBe(1);
        expect(month.previousIncomeCents).toBe(15000);
    });

    it("counts unique customers, including walk-ins by name", () => {
        const { month } = computeOwnerMetrics(
            [
                row("2026-11-02", "10:00", "COMPLETED"),
                row("2026-11-03", "10:00", "COMPLETED"),
                row("2026-11-04", "10:00", "COMPLETED", { userId: null, walkInName: "Luis Walk" }),
                row("2026-11-05", "10:00", "COMPLETED", { userId: null, walkInName: " luis walk " }),
            ],
            now,
            TZ
        );

        expect(month.customers).toBe(2);
    });

    it("calculates the no-show rate over the last 30 days", () => {
        const { noShows } = computeOwnerMetrics(
            [
                row("2026-11-02", "10:00", "COMPLETED"),
                row("2026-11-03", "10:00", "COMPLETED"),
                row("2026-11-04", "10:00", "COMPLETED"),
                row("2026-11-05", "10:00", "NO_SHOW"),
                row("2026-09-01", "10:00", "NO_SHOW"), // fuera de los 30 días
            ],
            now,
            TZ
        );

        expect(noShows).toEqual({ count: 1, percent: 25 });
    });

    it("ranks services and barbers by appointments this month", () => {
        const { topServices, byBarber } = computeOwnerMetrics(
            [
                row("2026-11-02", "10:00", "COMPLETED", { serviceName: "Barba", barberId: "b2", barberName: "Ana" }),
                row("2026-11-03", "10:00", "COMPLETED"),
                row("2026-11-04", "10:00", "COMPLETED"),
                row("2026-10-04", "10:00", "COMPLETED", { serviceName: "Antiguo" }),
            ],
            now,
            TZ
        );

        expect(topServices.map((s) => [s.label, s.count])).toEqual([["Corte", 2], ["Barba", 1]]);
        expect(byBarber.map((b) => [b.label, b.count])).toEqual([["Luis", 2], ["Ana", 1]]);
    });
});

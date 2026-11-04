import { describe, expect, it } from "vitest";
import { computeDaySlots, overlapsBusy } from "@/lib/services/booking.service";
import { computeBusinessHours } from "@/lib/business-hours";
import {
    DEFAULT_TIMEZONE,
    addDaysToKey,
    isValidDateKey,
    isValidTime,
    minutesOfDay,
    toDateKey,
    zonedToUtc,
} from "@/lib/time/zoned";

const TZ = "America/Tijuana";
const at = (dateKey: string, time: string) => zonedToUtc(dateKey, time, TZ).getTime();

describe("zoned time helpers", () => {
    it("defaults to Tijuana", () => {
        expect(DEFAULT_TIMEZONE).toBe(TZ);
    });

    it("converts Tijuana local time to UTC in winter (PST) and summer (PDT)", () => {
        expect(zonedToUtc("2026-11-10", "09:00", TZ).toISOString()).toBe("2026-11-10T17:00:00.000Z");
        expect(zonedToUtc("2026-07-10", "09:00", TZ).toISOString()).toBe("2026-07-10T16:00:00.000Z");
    });

    it("handles the daylight saving switch days", () => {
        expect(zonedToUtc("2026-03-08", "09:00", TZ).toISOString()).toBe("2026-03-08T16:00:00.000Z");
        expect(zonedToUtc("2026-11-01", "09:00", TZ).toISOString()).toBe("2026-11-01T17:00:00.000Z");
    });

    it("works with other offsets", () => {
        expect(zonedToUtc("2026-11-10", "09:00", "America/Mexico_City").toISOString()).toBe("2026-11-10T15:00:00.000Z");
        expect(zonedToUtc("2026-11-10", "09:00", "Asia/Kolkata").toISOString()).toBe("2026-11-10T03:30:00.000Z");
    });

    it("keeps late-evening appointments on the same local day", () => {
        const date = new Date("2026-11-11T04:00:00Z"); // 20:00 en Tijuana
        expect(toDateKey(date, TZ)).toBe("2026-11-10");
        expect(minutesOfDay(date, TZ)).toBe(20 * 60);
    });

    it("validates and moves date keys", () => {
        expect(addDaysToKey("2026-12-31", 1)).toBe("2027-01-01");
        expect(isValidDateKey("2026-02-29")).toBe(false);
        expect(isValidDateKey("2028-02-29")).toBe(true);
        expect(isValidTime("23:59")).toBe(true);
        expect(isValidTime("24:00")).toBe(false);
    });
});

describe("computeDaySlots", () => {
    const dateKey = "2026-11-10";
    const schedule = { startTime: "09:00", endTime: "14:00", breakStart: "12:00", breakEnd: "13:00" };
    const midnight = at(dateKey, "00:00");

    it("generates slots every 30 minutes and skips the break", () => {
        const slots = computeDaySlots({ dateKey, timezone: TZ, schedule, busy: [], now: midnight });

        expect(slots.map((s) => s.label)).toEqual([
            "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "01:00 PM", "01:30 PM",
        ]);
        expect(slots.map((s) => s.maxMinutes)).toEqual([180, 150, 120, 90, 60, 30, 60, 30]);
        expect(slots[0].start.toISOString()).toBe("2026-11-10T17:00:00.000Z");
    });

    it("blocks every slot covered by a long appointment", () => {
        const busy = [{ start: at(dateKey, "09:00"), end: at(dateKey, "10:30") }];
        const slots = computeDaySlots({ dateKey, timezone: TZ, schedule, busy, now: midnight });

        expect(slots.map((s) => s.label)).toEqual(["10:30 AM", "11:00 AM", "11:30 AM", "01:00 PM", "01:30 PM"]);
    });

    it("limits free minutes before the next appointment", () => {
        const busy = [{ start: at(dateKey, "10:00"), end: at(dateKey, "11:00") }];
        const [first] = computeDaySlots({ dateKey, timezone: TZ, schedule, busy, now: midnight });

        expect(first.label).toBe("09:00 AM");
        expect(first.maxMinutes).toBe(60);
    });

    it("hides slots that already started", () => {
        const slots = computeDaySlots({ dateKey, timezone: TZ, schedule, busy: [], now: at(dateKey, "10:30") });

        expect(slots.map((s) => s.label)).toEqual(["11:00 AM", "11:30 AM", "01:00 PM", "01:30 PM"]);
    });

    it("returns nothing on a full-day exception", () => {
        const busy = [{ start: at(dateKey, "00:00"), end: at(addDaysToKey(dateKey, 1), "00:00") }];

        expect(computeDaySlots({ dateKey, timezone: TZ, schedule, busy, now: midnight })).toEqual([]);
    });
});

describe("overlapsBusy", () => {
    const busy = [{ start: 100, end: 200 }];

    it("detects any crossing but allows back-to-back appointments", () => {
        expect(overlapsBusy(150, 250, busy)).toBe(true);
        expect(overlapsBusy(50, 150, busy)).toBe(true);
        expect(overlapsBusy(120, 130, busy)).toBe(true);
        expect(overlapsBusy(200, 300, busy)).toBe(false);
        expect(overlapsBusy(0, 100, busy)).toBe(false);
    });
});

describe("computeBusinessHours", () => {
    it("joins every barber's hours per day, Monday first", () => {
        const hours = computeBusinessHours([
            { dayOfWeek: 1, startTime: "10:00", endTime: "18:00" },
            { dayOfWeek: 1, startTime: "09:00", endTime: "16:00" },
            { dayOfWeek: 0, startTime: "11:00", endTime: "15:00" },
        ]);

        expect(hours[0]).toEqual({ dayOfWeek: 1, open: "09:00", close: "18:00" });
        expect(hours[1]).toEqual({ dayOfWeek: 2, open: null, close: null });
        expect(hours[6]).toEqual({ dayOfWeek: 0, open: "11:00", close: "15:00" });
    });
});

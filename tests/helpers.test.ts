import { describe, expect, it } from "vitest";
import { createSlug, extractBusinessSlug } from "@/lib/slug";
import { formatPriceFromCents } from "@/lib/billing/pricing";
import { normalizeMxPhone } from "@/lib/phone";
import { computePaidPeriod, getBillingAlert, trialEndsAt } from "@/lib/billing/periods";
import { addMonthsToKey, endOfDayUtc, toDateKey } from "@/lib/time/zoned";
import { getWhatsAppUrl } from "@/[locale]/business/[slug]/lib/business-page.utils";

describe("slugs", () => {
    it("creates URL-safe slugs from Spanish names", () => {
        expect(createSlug("Barbería El Niño  Rey!")).toBe("barberia-el-nino-rey");
    });

    it("extracts the slug from a full public link or QR URL", () => {
        expect(extractBusinessSlug("https://barbersaas.app/es/business/el-nuevo-rey")).toBe("el-nuevo-rey");
        expect(extractBusinessSlug("el-nuevo-rey")).toBe("el-nuevo-rey");
    });
});

describe("formatPriceFromCents", () => {
    it("shows decimals only when needed", () => {
        expect(formatPriceFromCents(15000)).toBe("$150");
        expect(formatPriceFromCents(9950)).toBe("$99.50");
    });
});

describe("getWhatsAppUrl", () => {
    it("adds Mexico's country code to 10-digit local numbers", () => {
        expect(getWhatsAppUrl("(664) 123-4567")).toBe("https://wa.me/526641234567");
        expect(getWhatsAppUrl("+52 664 123 4567")).toBe("https://wa.me/526641234567");
    });
});

describe("normalizeMxPhone", () => {
    it("keeps 10 national digits from any common format", () => {
        expect(normalizeMxPhone("(664) 123-4567")).toBe("6641234567");
        expect(normalizeMxPhone("+52 664 123 4567")).toBe("6641234567");
        expect(normalizeMxPhone("521 664 123 4567")).toBe("6641234567");
    });

    it("rejects numbers that are not Mexican 10-digit phones", () => {
        expect(normalizeMxPhone("12345")).toBeNull();
        expect(normalizeMxPhone("+1 619 555 0123 9")).toBeNull();
        expect(normalizeMxPhone("")).toBeNull();
    });
});

describe("membership periods", () => {
    const TZ = "America/Tijuana";
    const now = new Date("2026-11-10T20:00:00Z");
    const endOf = (key: string) => endOfDayUtc(key, TZ);
    const paid = (status: Parameters<typeof computePaidPeriod>[0]["status"], end: Date | null, months = 1) => {
        const { periodEnd } = computePaidPeriod({ status, currentPeriodEnd: end, months, now, timezone: TZ });
        return toDateKey(periodEnd, TZ);
    };

    it("adds months without overflowing", () => {
        expect(addMonthsToKey("2026-01-31", 1)).toBe("2026-02-28");
        expect(addMonthsToKey("2026-11-15", 3)).toBe("2027-02-15");
    });

    it("ends the trial at the end of the day, 30 days later", () => {
        expect(toDateKey(trialEndsAt(now, TZ), TZ)).toBe("2026-12-10");
    });

    it("continues a current period, so paying early loses nothing", () => {
        expect(paid("ACTIVE", endOf("2026-11-20"))).toBe("2026-12-20");
        expect(paid("TRIALING", endOf("2026-11-20"), 3)).toBe("2027-02-20");
    });

    it("does not give the grace days for free", () => {
        expect(paid("PAST_DUE", endOf("2026-11-05"))).toBe("2026-12-05");
    });

    it("starts today when suspended, canceled or without a period", () => {
        expect(paid("SUSPENDED", endOf("2026-10-01"))).toBe("2026-12-10");
        expect(paid("CANCELED", null)).toBe("2026-12-10");
        expect(paid("PENDING_PAYMENT", null)).toBe("2026-12-10");
    });

    it("only alerts when something needs attention", () => {
        const alert = (status: Parameters<typeof getBillingAlert>[0]["status"], end: Date | null) =>
            getBillingAlert({ status, currentPeriodEnd: end, now });

        expect(alert("ACTIVE", new Date("2026-12-30T00:00:00Z"))).toBeNull();
        expect(alert("ACTIVE", null)).toBeNull();
        expect(alert("ACTIVE", new Date("2026-11-13T20:00:00Z"))).toEqual({ kind: "dueSoon", days: 3 });
        expect(alert("TRIALING", new Date("2026-11-12T20:00:00Z"))).toEqual({ kind: "trialEnding", days: 2 });
        expect(alert("PAST_DUE", new Date("2026-11-08T20:00:00Z"))).toEqual({ kind: "pastDue", days: 5 });
        expect(alert("SUSPENDED", null)?.kind).toBe("suspended");
    });
});

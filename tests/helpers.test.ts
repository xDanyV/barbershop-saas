import { describe, expect, it } from "vitest";
import { createSlug, extractBusinessSlug } from "@/lib/slug";
import { formatPriceFromCents } from "@/lib/billing/pricing";
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

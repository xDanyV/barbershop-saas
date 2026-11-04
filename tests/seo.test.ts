import { describe, expect, it } from "vitest";
import { buildBarberShopJsonLd, getSiteUrl, localizedAlternates, serializeJsonLd } from "@/lib/site";

describe("getSiteUrl", () => {
    it("prefers the explicit address and removes the trailing slash", () => {
        expect(getSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://ejemplo.mx/", VERCEL_PROJECT_PRODUCTION_URL: "x.vercel.app" })).toBe("https://ejemplo.mx");
    });

    it("falls back to the Vercel production domain, then localhost", () => {
        expect(getSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "x.vercel.app" })).toBe("https://x.vercel.app");
        expect(getSiteUrl({})).toBe("http://localhost:3000");
    });
});

describe("localizedAlternates", () => {
    it("points at this language and lists both, with Spanish as default", () => {
        const links = localizedAlternates("/business/rey", "en", "https://ejemplo.mx");

        expect(links.canonical).toBe("https://ejemplo.mx/en/business/rey");
        expect(links.languages.es).toBe("https://ejemplo.mx/es/business/rey");
        expect(links.languages["x-default"]).toBe("https://ejemplo.mx/es/business/rey");
    });
});

describe("buildBarberShopJsonLd", () => {
    it("describes the shop with its phone and hours", () => {
        const data = buildBarberShopJsonLd({
            url: "https://ejemplo.mx/es/business/rey",
            name: "El Rey",
            phone: "664 123 4567",
            address: "Zona Centro",
            hours: [{ dayOfWeek: 1, startTime: "09:00", endTime: "18:00" }],
        });

        expect(data["@type"]).toBe("BarberShop");
        expect(data.telephone).toBe("+526641234567");
        expect(data.openingHoursSpecification).toEqual([
            { "@type": "OpeningHoursSpecification", dayOfWeek: "Monday", opens: "09:00", closes: "18:00" },
        ]);
    });

    it("omits what the shop has not filled in", () => {
        const data = buildBarberShopJsonLd({ url: "u", name: "El Rey", hours: [] });

        expect(Object.keys(data)).toEqual(["@context", "@type", "name", "url"]);
    });

    it("cannot break out of the script tag", () => {
        expect(serializeJsonLd({ name: "</script><script>alert(1)</script>" })).not.toContain("<");
    });
});

import { describe, expect, it } from "vitest";
import { directionsUrl, distanceKm, formatDistance, hasLocation } from "@/lib/geo";
import { updateBusinessSchema } from "@/lib/validations/schemas";

describe("geo", () => {
    it("measures distances between two points in Tijuana", () => {
        // Zona Centro a Otay Universidad: unos 10 km en línea recta
        const km = distanceKm({ latitude: 32.5333, longitude: -117.0372 }, { latitude: 32.5302, longitude: -116.9286 });
        expect(km).toBeGreaterThan(9.5);
        expect(km).toBeLessThan(10.8);
        expect(distanceKm({ latitude: 32.5, longitude: -117 }, { latitude: 32.5, longitude: -117 })).toBe(0);
    });

    it("formats short and long distances", () => {
        expect(formatDistance(0.34, "es")).toBe("350 m");
        expect(formatDistance(0.01, "es")).toBe("50 m");
        expect(formatDistance(1.234, "es")).toBe("1.2 km");
        expect(formatDistance(15.6, "en")).toBe("16 km");
    });

    it("knows which shops have a pin and links to directions", () => {
        expect(hasLocation({ latitude: 32.5, longitude: -117 })).toBe(true);
        expect(hasLocation({ latitude: null, longitude: -117 })).toBe(false);
        expect(directionsUrl({ latitude: 32.5, longitude: -117 })).toBe("https://www.google.com/maps/dir/?api=1&destination=32.5,-117");
    });

    it("accepts a pin or clearing it, and rejects impossible coordinates", () => {
        expect(updateBusinessSchema.parse({ location: { latitude: 32.5, longitude: -117 } }).location).toEqual({ latitude: 32.5, longitude: -117 });
        expect(updateBusinessSchema.parse({ location: null }).location).toBeNull();
        expect(updateBusinessSchema.safeParse({ location: { latitude: 120, longitude: -117 } }).success).toBe(false);
    });
});

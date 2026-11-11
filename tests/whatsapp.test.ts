import { describe, expect, it } from "vitest";
import { getWhatsAppUrl } from "@/[locale]/business/[slug]/lib/business-page.utils";

describe("getWhatsAppUrl", () => {
    it("adds Mexico's code to local numbers", () => {
        expect(getWhatsAppUrl("664 123 4567")).toBe("https://wa.me/526641234567");
        expect(getWhatsAppUrl("+52 664 123 4567")).toBe("https://wa.me/526641234567");
    });

    it("opens the chat with the message already written", () => {
        const url = getWhatsAppUrl("6641234567", "Hola Ana, tu cita del sábado a las 10:00 AM quedó confirmada & lista");
        expect(url.startsWith("https://wa.me/526641234567?text=")).toBe(true);
        expect(decodeURIComponent(url.split("?text=")[1])).toBe("Hola Ana, tu cita del sábado a las 10:00 AM quedó confirmada & lista");
    });
});

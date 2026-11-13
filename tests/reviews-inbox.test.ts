import { describe, expect, it } from "vitest";
import { isReviewable } from "@/lib/services/review.service";
import { renderNotification } from "@/lib/notifications/appointments";

const DAY = 24 * 60 * 60 * 1000;
const now = new Date("2026-11-13T20:00:00Z");

describe("isReviewable", () => {
    it("allows rating an attended appointment within 30 days", () => {
        expect(isReviewable({ status: "COMPLETED", date: new Date(now.getTime() - 2 * DAY) }, now)).toBe(true);
        expect(isReviewable({ status: "CONFIRMED", date: new Date(now.getTime() - 60 * 60 * 1000) }, now)).toBe(true);
    });

    it("rejects future, cancelled, missed or old appointments", () => {
        expect(isReviewable({ status: "CONFIRMED", date: new Date(now.getTime() + DAY) }, now)).toBe(false);
        expect(isReviewable({ status: "CANCELLED", date: new Date(now.getTime() - DAY) }, now)).toBe(false);
        expect(isReviewable({ status: "NO_SHOW", date: new Date(now.getTime() - DAY) }, now)).toBe(false);
        expect(isReviewable({ status: "COMPLETED", date: new Date(now.getTime() - 31 * DAY) }, now)).toBe(false);
    });
});

describe("renderNotification", () => {
    const data = {
        customer: "Ana",
        service: "Corte",
        business: "Barbería Norte",
        barber: "Jorge",
        date: "2026-11-14T18:00:00Z",
        timeZone: "America/Tijuana",
        rating: 5,
    };

    it("writes the notice in Spanish with the barbershop's local time", () => {
        const message = renderNotification("booked", data, "es");
        expect(message.title).toBe("Nueva cita: Ana");
        expect(message.body).toContain("10:00");
    });

    it("writes the same notice in English", () => {
        expect(renderNotification("newReview", data, "en").title).toBe("New review: 5 out of 5");
        expect(renderNotification("confirmed", data, "en").title).toBe("Your appointment is confirmed");
    });
});

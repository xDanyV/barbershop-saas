import { describe, expect, it } from "vitest";
import { businessThemeStyle, contrastRatio, readablePrimary, textOn } from "@/lib/theme";
import { updateBusinessSchema } from "@/lib/validations/schemas";

const vars = (style: unknown) => style as Record<string, string>;

describe("businessThemeStyle", () => {
    it("keeps the platform colors when the owner picked none", () => {
        expect(businessThemeStyle(null, null)).toBeUndefined();
        expect(businessThemeStyle("not-a-color", "#12")).toBeUndefined();
    });

    it("a dark main color also colors the text, with white on buttons", () => {
        const style = vars(businessThemeStyle("#7a1f2b", null));
        expect(style["--brand-primary"]).toBe("#7a1f2b");
        expect(style["--brand-on-primary"]).toBe("#ffffff");
        expect(style["--brand-ink"]).toBe("#7a1f2b");
    });

    it("a light main color keeps the text dark and puts dark text on buttons", () => {
        const style = vars(businessThemeStyle("#d4a017", "#2f7d5b"));
        expect(style["--brand-on-primary"]).toBe("#0f2733");
        expect(style["--brand-ink"]).toBeUndefined();
        expect(style["--brand-accent"]).toBe("#2f7d5b");
    });

    it("button text always reads well", () => {
        for (const color of ["#ffffff", "#000000", "#d4a017", "#3a7bd5", "#c2410c", "#e4dccb"]) {
            const primary = readablePrimary(color);
            expect(contrastRatio(primary, textOn(primary))).toBeGreaterThanOrEqual(4.5);
        }
    });
});

describe("updateBusinessSchema", () => {
    it("lets the logo be saved alone without touching the rest", () => {
        const parsed = updateBusinessSchema.parse({ logoUrl: "https://a.ufs.sh/f/key" });
        expect(parsed).toEqual({ logoUrl: "https://a.ufs.sh/f/key" });
    });

    it("accepts #rrggbb colors and clears them with null", () => {
        expect(updateBusinessSchema.parse({ themePrimary: "#7A1F2B", themeAccent: null })).toEqual({ themePrimary: "#7a1f2b", themeAccent: null });
        expect(updateBusinessSchema.safeParse({ themePrimary: "red" }).success).toBe(false);
    });
});

import { getOpenState } from "@/lib/business-hours";

describe("getOpenState", () => {
    const hours = [{ dayOfWeek: 1, open: "09:00", close: "19:00" }, { dayOfWeek: 0, open: null, close: null }];

    it("is open between opening and closing", () => {
        expect(getOpenState(hours, 1, 10 * 60)).toEqual({ open: true, closesAt: 19 * 60 });
    });

    it("says when it opens later today, and is closed after hours or on days off", () => {
        expect(getOpenState(hours, 1, 8 * 60)).toEqual({ open: false, opensTodayAt: 9 * 60 });
        expect(getOpenState(hours, 1, 19 * 60)).toEqual({ open: false, opensTodayAt: null });
        expect(getOpenState(hours, 0, 12 * 60)).toEqual({ open: false, opensTodayAt: null });
    });
});

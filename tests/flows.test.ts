import { describe, expect, it } from "vitest";
import { API_ERROR_CODES } from "@/lib/api-errors";
import { safeRedirectPath } from "@/lib/safe-redirect";
import es from "../messages/es.json";
import en from "../messages/en.json";

describe("safeRedirectPath", () => {
    it("keeps internal paths", () => {
        expect(safeRedirectPath("/es/business/rey/book")).toBe("/es/business/rey/book");
    });

    it("rejects anything that could leave the site", () => {
        for (const value of ["https://evil.test", "//evil.test", "/\\evil.test", "evil", "", null, undefined]) {
            expect(safeRedirectPath(value)).toBeNull();
        }
    });
});

describe("API error codes", () => {
    const codes = [...new Set([...Object.values(API_ERROR_CODES), "OWN_BUSINESS", "VALIDATION", "INVALID_PHONE"])];

    it("have a message in both languages", () => {
        for (const code of codes) {
            expect((es.ApiErrors as Record<string, string>)[code], `es ${code}`).toBeTruthy();
            expect((en.ApiErrors as Record<string, string>)[code], `en ${code}`).toBeTruthy();
        }
    });
});

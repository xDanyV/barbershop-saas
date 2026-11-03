import { describe, expect, it } from "vitest";
import {
    availabilitySchema,
    createExceptionSchema,
    createServiceSchema,
    registerSchema,
    toCents,
    updateBarberAdminSchema,
} from "@/lib/validations/schemas";

describe("availabilitySchema", () => {
    const base = { days: [1, 2], startTime: "09:00", endTime: "18:00" };

    it("accepts a schedule with a break inside working hours", () => {
        expect(availabilitySchema.safeParse({ ...base, breakStart: "13:00", breakEnd: "14:00" }).success).toBe(true);
    });

    it("rejects repeated days, inverted hours and breaks outside the schedule", () => {
        expect(availabilitySchema.safeParse({ ...base, days: [1, 1] }).success).toBe(false);
        expect(availabilitySchema.safeParse({ ...base, startTime: "18:00", endTime: "09:00" }).success).toBe(false);
        expect(availabilitySchema.safeParse({ ...base, breakStart: "19:00", breakEnd: "20:00" }).success).toBe(false);
        expect(availabilitySchema.safeParse({ ...base, breakStart: "13:00" }).success).toBe(false);
    });
});

describe("services", () => {
    it("converts pesos to integer cents", () => {
        expect(toCents(150)).toBe(15000);
        expect(toCents(99.99)).toBe(9999);
        expect(toCents(0.1 + 0.2)).toBe(30);
    });

    it("coerces form strings and rejects invalid prices", () => {
        expect(createServiceSchema.parse({ name: " Corte ", price: "120", duration: "30" })).toEqual({
            name: "Corte",
            price: 120,
            duration: 30,
        });
        expect(createServiceSchema.safeParse({ name: "Corte", price: -5, duration: 30 }).success).toBe(false);
    });
});

describe("createExceptionSchema", () => {
    it("keeps only the date part and checks the order", () => {
        expect(
            createExceptionSchema.parse({ startDate: "2026-12-01T00:00:00.000Z", endDate: "2026-12-03" })
        ).toMatchObject({ startDate: "2026-12-01", endDate: "2026-12-03", reason: null });
        expect(createExceptionSchema.safeParse({ startDate: "2026-12-05", endDate: "2026-12-01" }).success).toBe(false);
    });
});

describe("registerSchema", () => {
    it("normalizes email and enforces password length", () => {
        const parsed = registerSchema.parse({
            name: "Juan",
            email: "  JUAN@Correo.com ",
            phone: "6641234567",
            password: "12345678",
        });

        expect(parsed.email).toBe("juan@correo.com");
        expect(parsed.role).toBe("CUSTOMER");
        expect(registerSchema.safeParse({ ...parsed, password: "123" }).success).toBe(false);
    });
});

describe("updateBarberAdminSchema", () => {
    it("does not clear the photo when only the status changes", () => {
        const parsed = updateBarberAdminSchema.parse({ barberId: "b1", status: "APPROVED" });
        expect(parsed.profileImageUrl).toBeUndefined();
    });

    it("only accepts https images", () => {
        expect(
            updateBarberAdminSchema.safeParse({ barberId: "b1", profileImageUrl: "http://x.com/a.png" }).success
        ).toBe(false);
    });
});

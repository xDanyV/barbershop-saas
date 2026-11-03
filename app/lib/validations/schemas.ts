import { z } from "zod";
import { isValidDateKey, isValidTime } from "@/lib/time/zoned";

// Texto opcional: "" o solo espacios -> null
const optionalText = (max: number) =>
    z
        .string()
        .trim()
        .max(max)
        .nullish()
        .transform((value) => (value ? value : null));

const timeString = z.string().refine(isValidTime, "must be HH:mm");
const dateKey = z.string().refine(isValidDateKey, "must be YYYY-MM-DD");
const httpsUrl = z.string().trim().url().max(2048).refine((url) => url.startsWith("https://"), "must be an https URL");
const optionalUrl = z
    .union([httpsUrl, z.literal(""), z.null()])
    .optional()
    .transform((value) => (value ? value : null));

// Los precios llegan en pesos desde los formularios y se guardan en centavos
const priceInPesos = z.coerce.number().positive().max(1_000_000);
export const toCents = (pesos: number) => Math.round(pesos * 100);

// ---------- Auth ----------

export const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(1).max(200),
});

export const registerSchema = z.object({
    name: z.string().trim().min(1, "Name is required").max(100),
    email: z.string().trim().toLowerCase().email(),
    phone: z.string().trim().min(1, "Phone number is required").max(20),
    password: z.string().min(8).max(72),
    role: z.enum(["CUSTOMER", "BARBER"]).optional().default("CUSTOMER"),
    businessSlug: z.string().trim().max(300).optional(),
    acceptTerms: z.literal(true, { error: "You must accept the Terms and the Privacy Notice" }),
});

// ---------- Mi cuenta ----------

export const updateProfileSchema = z.object({
    name: z.string().trim().min(1, "Name is required").max(100),
    phone: z.string().trim().min(1, "Phone number is required").max(20),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1).max(200),
    newPassword: z.string().min(8).max(72),
});

export const deleteAccountSchema = z.object({
    password: z.string().min(1).max(200),
});

// ---------- Citas ----------

export const createAppointmentSchema = z.object({
    barberId: z.string().min(1),
    serviceId: z.string().min(1),
    date: z.string().datetime({ offset: true }),
    userId: z.string().optional(),
});

export const updateAppointmentStatusSchema = z.object({
    status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"]),
});

// ---------- Barbero: agenda, catálogo, excepciones ----------

export const availabilitySchema = z
    .object({
        days: z.array(z.number().int().min(0).max(6)).min(1).max(7),
        startTime: timeString,
        endTime: timeString,
        breakStart: timeString.nullish(),
        breakEnd: timeString.nullish(),
    })
    .refine((v) => new Set(v.days).size === v.days.length, { message: "days must be unique", path: ["days"] })
    .refine((v) => v.startTime < v.endTime, { message: "startTime must be before endTime", path: ["startTime"] })
    .refine((v) => Boolean(v.breakStart) === Boolean(v.breakEnd), {
        message: "Break needs a start and an end",
        path: ["breakStart"],
    })
    .refine(
        (v) =>
            !v.breakStart ||
            !v.breakEnd ||
            (v.breakStart < v.breakEnd && v.breakStart >= v.startTime && v.breakEnd <= v.endTime),
        { message: "Break must be inside working hours", path: ["breakStart"] }
    );

export const createServiceSchema = z.object({
    name: z.string().trim().min(1).max(100),
    price: priceInPesos,
    duration: z.coerce.number().int().min(5).max(600),
});

export const updateServiceSchema = createServiceSchema.partial().extend({
    active: z.boolean().optional(),
});

export const createExceptionSchema = z
    .object({
        // Se acepta "YYYY-MM-DD" o un ISO completo (se usa solo la fecha)
        startDate: z.string().transform((v) => v.split("T")[0]).pipe(dateKey),
        endDate: z.string().transform((v) => v.split("T")[0]).pipe(dateKey),
        reason: optionalText(200),
    })
    .refine((v) => v.startDate <= v.endDate, { message: "startDate cannot be after endDate", path: ["startDate"] });

// ---------- Negocio ----------

export const createBusinessSchema = z.object({
    name: z.string().trim().min(3, "Business name must be at least 3 characters long").max(100),
    description: optionalText(1000),
    phone: optionalText(20),
    address: optionalText(200),
    logoUrl: optionalUrl,
    coverUrl: optionalUrl,
});

export const updateBusinessSchema = createBusinessSchema.extend({
    isServiceActive: z.boolean().optional(),
    maintenanceMessage: z.string().trim().max(300).optional(),
});

export const galleryItemSchema = z.object({
    imageUrl: httpsUrl,
    caption: optionalText(200),
    position: z.number().int().min(0).max(1000).optional().default(0),
});

export const businessPostSchema = z.object({
    content: z.string().trim().min(3, "Post content must be at least 3 characters long").max(2000),
    imageUrl: optionalUrl,
});

export const managedBarberSchema = z.object({
    barberId: z.string().min(1).nullish(),
});

// ---------- Admin ----------

export const updateBarberAdminSchema = z
    .object({
        barberId: z.string().min(1),
        status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
        // undefined = no tocar la foto; "" o null = quitarla
        profileImageUrl: z.union([httpsUrl, z.literal(""), z.null()]).optional(),
    })
    .refine((v) => v.status !== undefined || v.profileImageUrl !== undefined, { message: "No data to update" });

export const updateCustomerBanSchema = z.object({
    customerId: z.string().min(1),
    isBanned: z.boolean(),
});

export const systemSettingsSchema = z.object({
    isServiceActive: z.boolean().optional(),
    maintenanceMessage: z.string().trim().max(300).optional(),
});

export const updateBillingSchema = z.object({
    businessId: z.string().min(1),
    billingStatus: z.enum(["PENDING_PAYMENT", "ACTIVE", "PAST_DUE", "SUSPENDED", "CANCELED"]),
    billingPlan: z.enum(["FOUNDER", "BASIC"]),
    subscriptionEndsAt: z.union([dateKey, z.literal(""), z.null()]).optional(),
});

import { z } from "zod";
import { isValidDateKey, isValidTime } from "@/lib/time/zoned";
import { normalizeMxPhone } from "@/lib/phone";

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

// Teléfono de México: se guarda con 10 dígitos aunque llegue con espacios, guiones o +52
const mxPhone = z.string().trim().transform((value, ctx) => {
    const phone = normalizeMxPhone(value);
    if (!phone) {
        ctx.addIssue({ code: "custom", message: "Enter a 10-digit Mexican phone number" });
        return z.NEVER;
    }
    return phone;
});

const optionalMxPhone = z
    .union([mxPhone, z.literal(""), z.null()])
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
    phone: mxPhone,
    password: z.string().min(8).max(72),
    role: z.enum(["CUSTOMER", "BARBER"]).optional().default("CUSTOMER"),
    businessSlug: z.string().trim().max(300).optional(),
    acceptTerms: z.literal(true, { error: "You must accept the Terms and the Privacy Notice" }),
});

// ---------- Mi cuenta ----------

export const updateProfileSchema = z.object({
    name: z.string().trim().min(1, "Name is required").max(100),
    phone: mxPhone,
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1).max(200),
    newPassword: z.string().min(8).max(72),
});

export const favoriteBusinessSchema = z.object({
    businessId: z.string().min(1).max(100),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(20).max(200),
    newPassword: z.string().min(8).max(72),
});

export const resetLinkForBarberSchema = z.object({
    barberId: z.string().min(1),
});

export const resetLinkForEmailSchema = z.object({
    email: z.string().trim().toLowerCase().email().max(200),
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

export const createManualAppointmentSchema = z.object({
    serviceId: z.string().min(1),
    date: dateKey,
    time: timeString,
    name: z.string().trim().min(1, "Name is required").max(100),
    phone: optionalMxPhone,
    // El barbero ya vio el aviso de que la cita queda fuera de su horario y la quiere de todos modos
    allowOutsideHours: z.boolean().optional(),
});

export const rescheduleAppointmentSchema = z.object({
    date: z.string().datetime({ offset: true }),
});

export const updateAppointmentStatusSchema = z.object({
    status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"]),
});

// ---------- Barbero: agenda, catálogo, excepciones ----------

// Un día del horario semanal: horas de trabajo y, opcional, un descanso dentro de ellas
const availabilityDaySchema = z
    .object({
        dayOfWeek: z.number().int().min(0).max(6),
        startTime: timeString,
        endTime: timeString,
        breakStart: timeString.nullish(),
        breakEnd: timeString.nullish(),
    })
    .refine((v) => v.startTime < v.endTime, { message: "startTime must be before endTime", path: ["startTime"] })
    .refine((v) => Boolean(v.breakStart) === Boolean(v.breakEnd), { message: "Break needs a start and an end", path: ["breakStart"] })
    .refine(
        (v) => !v.breakStart || !v.breakEnd || (v.breakStart < v.breakEnd && v.breakStart >= v.startTime && v.breakEnd <= v.endTime),
        { message: "Break must be inside working hours", path: ["breakStart"] }
    );

// Sin días = el barbero no recibe citas por ahora
export const availabilitySchema = z.object({
    days: z
        .array(availabilityDaySchema)
        .max(7)
        .refine((days) => new Set(days.map((d) => d.dayOfWeek)).size === days.length, { message: "days must be unique" }),
});

export const createServiceSchema = z.object({
    name: z.string().trim().min(1).max(100),
    price: priceInPesos,
    duration: z.coerce.number().int().min(5).max(600),
    // Solo el dueño: crea el mismo servicio para cada barbero activo del equipo
    applyToTeam: z.boolean().optional(),
});

export const updateServiceSchema = createServiceSchema.omit({ applyToTeam: true }).partial().extend({
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
    phone: optionalMxPhone,
    address: optionalText(200),
    logoUrl: optionalUrl,
    coverUrl: optionalUrl,
});

const optionalHexColor = z
    .union([z.string().regex(/^#[0-9a-fA-F]{6}$/, "must be a #rrggbb color"), z.null()])
    .optional()
    .transform((value) => (value === undefined ? undefined : value?.toLowerCase() ?? null));

// Todo es opcional: lo que no llega se queda igual (así el logo se guarda solo, sin el resto del formulario)
export const updateBusinessSchema = createBusinessSchema.partial().extend({
    themePrimary: optionalHexColor,
    themeAccent: optionalHexColor,
    // Pin en el mapa; null lo quita
    location: z
        .object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) })
        .nullable()
        .optional(),
    isServiceActive: z.boolean().optional(),
    autoConfirm: z.boolean().optional(),
    reviewsEnabled: z.boolean().optional(),
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
        // false = dar de baja del equipo; true = reactivar
        active: z.boolean().optional(),
        // undefined = no tocar la foto; "" o null = quitarla
        profileImageUrl: z.union([httpsUrl, z.literal(""), z.null()]).optional(),
    })
    .refine((v) => v.status !== undefined || v.active !== undefined || v.profileImageUrl !== undefined, { message: "No data to update" });

export const updateCustomerBanSchema = z.object({
    customerId: z.string().min(1),
    isBanned: z.boolean(),
});

export const systemSettingsSchema = z.object({
    isServiceActive: z.boolean().optional(),
    autoConfirm: z.boolean().optional(),
    maintenanceMessage: z.string().trim().max(300).optional(),
    paymentInstructions: z.string().trim().max(1000).nullish(),
    supportPhone: optionalMxPhone,
});

export const updateBusinessActiveSchema = z.object({
    active: z.boolean(),
    reason: z.string().trim().max(200).optional(),
});

export const recordPaymentSchema = z.object({
    amountCents: z.number().int().min(0).max(100_000_00),
    method: z.enum(["CASH", "TRANSFER", "CARD", "OTHER"]),
    months: z.number().int().min(1).max(24),
    paidAt: dateKey,
    note: z.string().trim().max(200).nullish(),
});

export const updateBillingSchema = z.object({
    businessId: z.string().min(1),
    billingStatus: z.enum(["TRIALING", "PENDING_PAYMENT", "ACTIVE", "PAST_DUE", "SUSPENDED", "CANCELED"]),
    billingPlan: z.enum(["FOUNDER", "BASIC"]),
    subscriptionEndsAt: z.union([dateKey, z.literal(""), z.null()]).optional(),
});

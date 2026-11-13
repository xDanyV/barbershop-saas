import { createTranslator, type AbstractIntlMessages } from "next-intl";
import { prisma } from "@/lib/prisma";
import { resolveTimezone } from "@/lib/time/zoned";
import { sendPush, sendPushLater } from "@/lib/push";
import es from "../../../messages/es.json";
import en from "../../../messages/en.json";

// Qué pasó y a quién se le avisa:
// - al barbero, lo que hace el cliente (reservar, cancelar, cambiar horario) y las reseñas nuevas
// - al cliente, lo que hace la barbería (confirmar, cancelar, cambiar horario) y el recordatorio del día
export type AppointmentEvent =
    | "booked"
    | "requested"
    | "cancelledByCustomer"
    | "rescheduledByCustomer"
    | "confirmed"
    | "cancelledByBusiness"
    | "rescheduledByBusiness"
    | "reminder";

export type NotificationEvent = AppointmentEvent | "newReview";

// Datos guardados con cada aviso: el texto se escribe en el idioma de quien lo lee
export type NotificationData = {
    customer: string;
    service: string;
    business: string;
    barber: string;
    date: string;
    timeZone: string;
    rating?: number;
};

const TO_BARBER: AppointmentEvent[] = ["booked", "requested", "cancelledByCustomer", "rescheduledByCustomer"];

// Sin el tipo exacto del JSON: con tantos textos el compilador no termina de inferir las claves
const MESSAGES: Record<"es" | "en", AbstractIntlMessages> = { es, en };

function translator(locale: string) {
    const lang = locale === "en" ? "en" : "es";
    const translate = createTranslator({ locale: lang, messages: MESSAGES[lang], namespace: "Push" }) as unknown as (
        key: string,
        values?: Record<string, string | number>
    ) => string;
    return { lang, t: translate };
}

// Texto de un aviso en un idioma: lo usan el push y la bandeja
export function renderNotification(event: NotificationEvent, data: NotificationData, locale: string) {
    const { lang, t } = translator(locale);
    const dateLocale = lang === "en" ? "en-US" : "es-MX";
    const date = new Date(data.date);
    const values = {
        customer: data.customer || t("someone"),
        service: data.service,
        business: data.business,
        barber: data.barber,
        rating: data.rating ?? 0,
        day: date.toLocaleDateString(dateLocale, { timeZone: data.timeZone, weekday: "short", day: "numeric", month: "short" }),
        time: date.toLocaleTimeString(dateLocale, { timeZone: data.timeZone, hour: "numeric", minute: "2-digit" }),
    };

    return { title: t(`${event}.title`, values), body: t(`${event}.body`, values) };
}

// Guarda el aviso en la bandeja y lo manda como push a sus dispositivos
async function deliver(userId: string, event: NotificationEvent, data: NotificationData, path: string, tag: string) {
    await prisma.notification.create({
        data: { userId, event, data, url: path },
    });

    return sendPush(userId, (locale) => ({
        ...renderNotification(event, data, locale),
        url: `/${locale === "en" ? "en" : "es"}${path}`,
        tag,
    }));
}

async function loadAppointment(appointmentId: string) {
    return prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: {
            date: true,
            userId: true,
            walkInName: true,
            user: { select: { name: true } },
            service: { select: { name: true } },
            barber: { select: { userId: true, user: { select: { name: true } } } },
            business: { select: { name: true, timezone: true, ownerId: true } },
        },
    });
}

function dataFor(appointment: NonNullable<Awaited<ReturnType<typeof loadAppointment>>>): NotificationData {
    return {
        customer: (appointment.user?.name ?? appointment.walkInName ?? "").split(" ")[0],
        service: appointment.service.name,
        business: appointment.business.name,
        barber: appointment.barber.user.name ?? "",
        date: appointment.date.toISOString(),
        timeZone: resolveTimezone(appointment.business.timezone),
    };
}

export async function notifyAppointment(appointmentId: string, event: AppointmentEvent) {
    const appointment = await loadAppointment(appointmentId);
    if (!appointment) return { sent: 0 };

    const toBarber = TO_BARBER.includes(event);
    const recipient = toBarber ? appointment.barber.userId : appointment.userId;

    // Citas sin cuenta (agregadas por la barbería) no tienen a quién avisar del lado del cliente
    if (!recipient) return { sent: 0 };

    return deliver(
        recipient,
        event,
        dataFor(appointment),
        toBarber ? "/dashboard/barber" : "/dashboard/customer/home",
        `appointment-${appointmentId}`
    );
}

// Reseña nueva: le avisa al barbero calificado y, si es otra persona, al dueño
export async function notifyReview(reviewId: string) {
    const review = await prisma.review.findUnique({
        where: { id: reviewId },
        select: { rating: true, appointmentId: true },
    });
    if (!review) return { sent: 0 };

    const appointment = await loadAppointment(review.appointmentId);
    if (!appointment) return { sent: 0 };

    const data = { ...dataFor(appointment), rating: review.rating };
    const recipients = [...new Set([appointment.barber.userId, appointment.business.ownerId])];
    let sent = 0;

    for (const userId of recipients) {
        const path = userId === appointment.business.ownerId ? "/dashboard/admin/my-business?tab=reviews" : "/dashboard/barber/reviews";
        sent += (await deliver(userId, "newReview", data, path, `review-${reviewId}`)).sent;
    }

    return { sent };
}

// Para las rutas: el aviso sale después de responder
export function notifyAppointmentLater(appointmentId: string, event: AppointmentEvent) {
    sendPushLater(() => notifyAppointment(appointmentId, event));
}

export function notifyReviewLater(reviewId: string) {
    sendPushLater(() => notifyReview(reviewId));
}

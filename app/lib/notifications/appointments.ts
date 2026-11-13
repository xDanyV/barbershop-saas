import { createTranslator, type AbstractIntlMessages } from "next-intl";
import { prisma } from "@/lib/prisma";
import { resolveTimezone } from "@/lib/time/zoned";
import { sendPush, sendPushLater } from "@/lib/push";
import es from "../../../messages/es.json";
import en from "../../../messages/en.json";

// Qué pasó con una cita y a quién se le avisa:
// - al barbero, lo que hace el cliente (reservar, cancelar, cambiar horario)
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

const TO_BARBER: AppointmentEvent[] = ["booked", "requested", "cancelledByCustomer", "rescheduledByCustomer"];

// Sin el tipo exacto del JSON: con tantos textos el compilador no termina de inferir las claves
const MESSAGES: Record<"es" | "en", AbstractIntlMessages> = { es, en };

function translator(locale: string) {
    const lang = locale === "en" ? "en" : "es";
    const translate = createTranslator({ locale: lang, messages: MESSAGES[lang], namespace: "Push" }) as unknown as (
        key: string,
        values?: Record<string, string>
    ) => string;
    return { lang, t: translate };
}

export async function notifyAppointment(appointmentId: string, event: AppointmentEvent) {
    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: {
            date: true,
            userId: true,
            walkInName: true,
            user: { select: { name: true } },
            service: { select: { name: true } },
            barber: { select: { userId: true, user: { select: { name: true } } } },
            business: { select: { name: true, timezone: true } },
        },
    });

    if (!appointment) return { sent: 0 };

    const toBarber = TO_BARBER.includes(event);
    const recipient = toBarber ? appointment.barber.userId : appointment.userId;

    // Citas sin cuenta (agregadas por la barbería) no tienen a quién avisar del lado del cliente
    if (!recipient) return { sent: 0 };

    const timeZone = resolveTimezone(appointment.business.timezone);

    return sendPush(recipient, (locale) => {
        const { lang, t } = translator(locale);
        const dateLocale = lang === "en" ? "en-US" : "es-MX";
        const values = {
            customer: (appointment.user?.name ?? appointment.walkInName ?? "").split(" ")[0] || t("someone"),
            service: appointment.service.name,
            business: appointment.business.name,
            barber: appointment.barber.user.name ?? "",
            day: appointment.date.toLocaleDateString(dateLocale, { timeZone, weekday: "short", day: "numeric", month: "short" }),
            time: appointment.date.toLocaleTimeString(dateLocale, { timeZone, hour: "numeric", minute: "2-digit" }),
        };

        return {
            title: t(`${event}.title`, values),
            body: t(`${event}.body`, values),
            url: toBarber ? `/${lang}/dashboard/barber` : `/${lang}/dashboard/customer/home`,
            tag: `appointment-${appointmentId}`,
        };
    });
}

// Para las rutas: el aviso sale después de responder
export function notifyAppointmentLater(appointmentId: string, event: AppointmentEvent) {
    sendPushLater(() => notifyAppointment(appointmentId, event));
}

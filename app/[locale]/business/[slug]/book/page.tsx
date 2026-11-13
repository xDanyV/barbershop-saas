import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { getBookingBusiness } from "@/lib/cache/business-pages";
import { canBusinessAcceptBookings, getBillingStatus } from "@/lib/billing/status";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { SESSION_COOKIE, getSessionFromToken } from "@/lib/auth/session";
import { MAX_ACTIVE_APPOINTMENTS, countActiveAppointments, isBannedFromBusiness, isBusinessStaff } from "@/lib/services/appointment.service";
import { getTranslations } from "next-intl/server";
import { brandFontClasses } from "@/[locale]/brand";
import { businessThemeStyle } from "@/lib/theme";
import { resolveTimezone } from "@/lib/time/zoned";
import BusinessBookingClient from "./BusinessBookingClient";
import { getWhatsAppUrl } from "../lib/business-page.utils";

type BookPageProps = {
    params: Promise<{
        locale: string;
        slug: string;
    }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// La página que se indexa es el perfil del negocio
export async function generateMetadata({ params }: BookPageProps): Promise<Metadata> {
    const { locale, slug } = await params;
    const business = await getBookingBusiness(slug);
    const t = await getTranslations({ locale, namespace: "BookingPage" });

    return {
        title: business ? t("meta", { name: business.name }) : undefined,
        robots: { index: false, follow: false },
    };
}

const single = (value: string | string[] | undefined) => (typeof value === "string" ? value : null);

// Aviso a pantalla completa con el estilo de la marca (reservas pausadas, tu propia barbería, etc.)
function Notice({ title, text, theme, children }: { title: string; text: string; theme?: CSSProperties; children?: ReactNode }) {
    return (
        <main className={`brand ${brandFontClasses} flex min-h-screen items-center justify-center px-4 py-10`} style={theme}>
            <div className="w-full max-w-md bg-[var(--brand-paper)] p-6 sm:p-8">
                <h1 className="brand-display text-[length:var(--step-head)]">{title}</h1>
                <p className="mt-3 text-[var(--brand-muted)]">{text}</p>
                {children && <div className="mt-6 flex flex-col gap-3">{children}</div>}
            </div>
        </main>
    );
}

const primaryLink =
    "inline-flex min-h-12 items-center justify-center bg-[var(--brand-primary)] px-6 font-semibold text-[var(--brand-on-primary)] transition-opacity hover:opacity-90";
const secondaryLink = "inline-flex min-h-12 items-center justify-center border border-[var(--brand-ink)] px-6 font-semibold";

export default async function BusinessBookPage({ params, searchParams }: BookPageProps) {
    const { locale, slug } = await params;
    const query = await searchParams;

    const business = await getBookingBusiness(slug);

    if (!business || !business.active) {
        notFound();
    }

    const t = await getTranslations("BookingPage");
    const profileUrl = `/${locale}/business/${business.slug}`;
    const theme = businessThemeStyle(business.themePrimary, business.themeAccent);
    const whatsappUrl = business.phone ? getWhatsAppUrl(business.phone, t("whatsappMessage")) : null;
    const contactLinks = (
        <>
            {whatsappUrl && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={primaryLink}>
                    {t("contactWhatsapp")}
                </a>
            )}
            <Link href={profileUrl} className={secondaryLink}>
                {t("backToProfile")}
            </Link>
        </>
    );

    if (!canBusinessAcceptBookings(getBillingStatus(business.subscription))) {
        return (
            <Notice title={business.name} text={`${t("paused")} ${t("pausedHint")}`} theme={theme}>
                {contactLinks}
            </Notice>
        );
    }

    // El equipo no reserva en su propia barbería: se le evita recorrer el flujo para acabar en un error
    const cookieStore = await cookies();
    const session = await getSessionFromToken(cookieStore.get(SESSION_COOKIE)?.value).catch(() => null);

    if (session && (await isBusinessStaff(session.userId, business.id))) {
        return (
            <Notice title={t("ownBusiness.title")} text={t("ownBusiness.text")} theme={theme}>
                <Link href={`/${locale}/dashboard/barber`} className={primaryLink}>
                    {t("ownBusiness.action")}
                </Link>
            </Notice>
        );
    }

    if (business.settings && !business.settings.isServiceActive) {
        return (
            <Notice title={business.name} text={business.settings.maintenanceMessage || t("inactive")} theme={theme}>
                {contactLinks}
            </Notice>
        );
    }

    if (business.barbers.length === 0) {
        return (
            <Notice title={business.name} text={t("noBarbers")} theme={theme}>
                {contactLinks}
            </Notice>
        );
    }

    // Sin cuenta no se empieza a elegir: primero se crea la cuenta y luego vuelve aquí con lo que traía
    if (!session) {
        const params = new URLSearchParams();
        for (const key of ["barber", "service", "date", "time"]) {
            const value = single(query[key]);
            if (value) params.set(key, value);
        }
        const back = `/${locale}/business/${business.slug}/book${params.size ? `?${params}` : ""}`;
        redirect(`/${locale}/register?redirectTo=${encodeURIComponent(back)}`);
    }

    if (await isBannedFromBusiness(session.userId, business.id)) {
        return (
            <Notice title={business.name} text={t("banned")} theme={theme}>
                <Link href={`/${locale}/dashboard/customer/home`} className={primaryLink}>
                    {t("myAppointments")}
                </Link>
            </Notice>
        );
    }

    // Con el límite de citas activas alcanzado se avisa antes de elegir, no al confirmar
    if ((await countActiveAppointments(session.userId, business.id)) >= MAX_ACTIVE_APPOINTMENTS) {
        return (
            <Notice title={t("limit.title")} text={t("limit.text", { count: MAX_ACTIVE_APPOINTMENTS, name: business.name })} theme={theme}>
                <Link href={`/${locale}/dashboard/customer/home`} className={primaryLink}>
                    {t("myAppointments")}
                </Link>
                <Link href={profileUrl} className={secondaryLink}>
                    {t("backToProfile")}
                </Link>
            </Notice>
        );
    }

    return (
        <BusinessBookingClient
            business={{
                name: business.name,
                slug: business.slug,
                logoUrl: business.logoUrl,
                autoConfirm: business.settings?.autoConfirm ?? true,
                themePrimary: business.themePrimary,
                themeAccent: business.themeAccent,
                timezone: resolveTimezone(business.timezone),
                barbers: business.barbers.map((barber) => ({
                    id: barber.id,
                    name: barber.user.name || t("barberFallback"),
                    imageUrl: barber.profileImageUrl,
                    services: barber.services,
                    workDays: [...new Set(barber.availability.map((day) => day.dayOfWeek))],
                })),
            }}
            initial={{
                barber: single(query.barber),
                service: single(query.service),
                date: single(query.date),
                time: single(query.time),
            }}
        />
    );
}

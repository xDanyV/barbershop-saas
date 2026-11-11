import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getBookingBusiness } from "@/lib/cache/business-pages";
import { canBusinessAcceptBookings, getBillingStatus } from "@/lib/billing/status";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { SESSION_COOKIE, getSessionFromToken } from "@/lib/auth/session";
import { isBusinessStaff } from "@/lib/services/appointment.service";
import { getTranslations } from "next-intl/server";
import { brandFontClasses } from "@/[locale]/brand";
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
function Notice({ title, text, children }: { title: string; text: string; children?: ReactNode }) {
    return (
        <main className={`brand ${brandFontClasses} flex min-h-screen items-center justify-center px-4 py-10`}>
            <div className="w-full max-w-md bg-[var(--brand-paper)] p-6 sm:p-8">
                <h1 className="brand-display text-[length:var(--step-head)]">{title}</h1>
                <p className="mt-3 text-[var(--brand-muted)]">{text}</p>
                {children && <div className="mt-6 flex flex-col gap-3">{children}</div>}
            </div>
        </main>
    );
}

const primaryLink =
    "inline-flex min-h-12 items-center justify-center bg-[var(--brand-ink)] px-6 font-semibold text-[var(--brand-paper)] transition-opacity hover:opacity-90";
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
    const whatsappUrl = business.phone ? getWhatsAppUrl(business.phone) : null;
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
            <Notice title={business.name} text={`${t("paused")} ${t("pausedHint")}`}>
                {contactLinks}
            </Notice>
        );
    }

    // El equipo no reserva en su propia barbería: se le evita recorrer el flujo para acabar en un error
    const cookieStore = await cookies();
    const session = await getSessionFromToken(cookieStore.get(SESSION_COOKIE)?.value).catch(() => null);

    if (session && (await isBusinessStaff(session.userId, business.id))) {
        return (
            <Notice title={t("ownBusiness.title")} text={t("ownBusiness.text")}>
                <Link href={`/${locale}/dashboard/barber`} className={primaryLink}>
                    {t("ownBusiness.action")}
                </Link>
            </Notice>
        );
    }

    if (business.settings && !business.settings.isServiceActive) {
        return (
            <Notice title={business.name} text={business.settings.maintenanceMessage || t("inactive")}>
                {contactLinks}
            </Notice>
        );
    }

    if (business.barbers.length === 0) {
        return (
            <Notice title={business.name} text={t("noBarbers")}>
                {contactLinks}
            </Notice>
        );
    }

    return (
        <BusinessBookingClient
            business={{
                name: business.name,
                slug: business.slug,
                logoUrl: business.logoUrl,
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

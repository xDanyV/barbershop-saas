import type { Metadata } from "next";
import { getBookingBusiness } from "@/lib/cache/business-pages";
import { canBusinessAcceptBookings, getBillingStatus } from "@/lib/billing/status";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import BusinessBookingClient from "./BusinessBookingClient";

// La página que se indexa es el perfil del negocio
export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

type BookPageProps = {
    params: Promise<{
        locale: string;
        slug: string;
    }>;
};

export default async function BusinessBookPage({ params }: BookPageProps) {
    const { locale, slug } = await params;

    const business = await getBookingBusiness(slug);

    if (!business || !business.active) {
        notFound();
    }

    const t = await getTranslations("BookingPage");
    const canAcceptBookings = canBusinessAcceptBookings(getBillingStatus(business.subscription));

    if (!canAcceptBookings) {
        return (
            <main className="theme-field min-h-screen bg-[#0f2733] text-white flex items-center justify-center px-4">
                <div className="max-w-md bg-white/5 border border-white/10 rounded-3xl p-8 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-300 flex items-center justify-center mx-auto mb-5">
                        <span className="text-2xl">!</span>
                    </div>

                    <h1 className="text-2xl font-black">{business.name}</h1>

                    <p className="text-gray-400 mt-4">
                        {t("paused")}
                    </p>

                    <p className="text-gray-500 text-sm mt-3">
                        {t("pausedHint")}
                    </p>
                </div>
            </main>
        );
    }

    if (business.settings && !business.settings.isServiceActive) {
        return (
            <main className="theme-field min-h-screen bg-[#0f2733] text-white flex items-center justify-center px-4">
                <div className="max-w-md bg-white/5 border border-white/10 rounded-3xl p-8 text-center">
                    <h1 className="text-2xl font-black">{business.name}</h1>
                    <p className="text-gray-400 mt-4">
                        {business.settings.maintenanceMessage || t("inactive")}
                    </p>
                </div>
            </main>
        );
    }

    return (
        <BusinessBookingClient
            locale={locale}
            business={{
                name: business.name,
                slug: business.slug,
                description: business.description,
                barbers: business.barbers,
            }}
        />
    );
}
import type { Metadata } from "next";
import { getPublicBusinessPage } from "@/lib/cache/business-pages";
import { buildBarberShopJsonLd, getSiteUrl, localizedAlternates, serializeJsonLd } from "@/lib/site";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import BusinessHero from "./components/BusinessHero";
import BarberCarousel from "./components/BarberCarousel";
import BusinessGallery from "./components/BusinessGallery";
import BusinessHours from "./components/BusinessHours";
import BusinessPosts from "./components/BusinessPosts";
import FloatingContactCard from "./components/FloatingContactCard";
import BusinessCTA from "./components/BusinessCTA";
import BusinessPublicNavbar from "./components/BusinessPublicNavbar";
import { groupServicesByName } from "./lib/business-page.utils";

type BusinessPageProps = {
    params: Promise<{
        locale: string;
        slug: string;
    }>;
};

export async function generateMetadata({ params }: BusinessPageProps): Promise<Metadata> {
    const { locale, slug } = await params;
    const business = await getPublicBusinessPage(slug);

    if (!business || !business.active) return { robots: { index: false, follow: false } };

    const t = await getTranslations({ locale, namespace: "BusinessPage.meta" });
    const title = t("title", { name: business.name });
    const description = business.description || t("description", { name: business.name });
    const image = business.coverUrl || business.logoUrl;

    return {
        title,
        description,
        alternates: localizedAlternates(`/business/${business.slug}`, locale),
        openGraph: {
            type: "website",
            locale: locale === "en" ? "en_US" : "es_MX",
            title,
            description,
            url: `/${locale}/business/${business.slug}`,
            images: image ? [{ url: image }] : [{ url: "/og.png", width: 1200, height: 630 }],
        },
    };
}

export default async function BusinessPage({ params }: BusinessPageProps) {
    const { locale, slug } = await params;

    // Los negocios suspendidos o cancelados no se muestran públicamente
    const business = await getPublicBusinessPage(slug);

    if (!business || !business.active) {
        notFound();
    }

    const tCarousel = await getTranslations("BusinessPage.carousel");
    const isServiceActive = business.settings?.isServiceActive ?? true;
    const bookUrl = `/${locale}/business/${business.slug}/book`;

    const groupedServices = groupServicesByName(business.services);

    const barbersForCarousel = business.barbers.map((barber) => ({
        id: barber.id,
        name: barber.user.name || tCarousel("fallbackName"),
        imageUrl: barber.profileImageUrl || null,
    }));

    const jsonLd = buildBarberShopJsonLd({
        url: `${getSiteUrl()}/${locale}/business/${business.slug}`,
        name: business.name,
        description: business.description,
        phone: business.phone,
        address: business.address,
        image: business.coverUrl || business.logoUrl,
        hours: business.barbers.flatMap((barber) => barber.availability),
    });

    return (
        <main className="theme-field min-h-screen bg-[#0f2733] text-white overflow-hidden">

            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

            <BusinessPublicNavbar locale={locale} slug={business.slug} />

            <BusinessHero
                business={business}
                locale={locale}
                isServiceActive={isServiceActive}
                serviceCount={groupedServices.length}
                barberCount={business.barbers.length}
                galleryCount={business.gallery.length}
            />

            <section className="max-w-6xl mx-auto px-4 pt-12 md:pt-16 pb-8 md:pb-10 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
                <div>
                    <BarberCarousel
                        barbers={barbersForCarousel}
                        bookUrl={bookUrl}
                    />
                </div>

                <aside className="space-y-6">
                    <BusinessHours
                        rows={business.barbers.flatMap((barber) => barber.availability)}
                        timezone={business.timezone}
                    />

                    <BusinessGallery gallery={business.gallery} />

                    <FloatingContactCard
                        phone={business.phone}
                        address={business.address}
                    />
                </aside>
            </section>

            <section className="max-w-6xl mx-auto px-4 pb-12 md:pb-16">
                <BusinessPosts posts={business.posts} />
            </section>

            <BusinessCTA
                businessName={business.name}
                bookUrl={bookUrl}
                isServiceActive={isServiceActive}
            />
        </main>
    );
}
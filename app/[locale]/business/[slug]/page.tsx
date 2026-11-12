import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowRight, MapPin, MessageCircle, Phone } from "lucide-react";
import { getPublicBusinessPage } from "@/lib/cache/business-pages";
import { buildBarberShopJsonLd, getSiteUrl, localizedAlternates, serializeJsonLd } from "@/lib/site";
import { computeBusinessHours } from "@/lib/business-hours";
import { formatPriceFromCents } from "@/lib/billing/pricing";
import { brandFontClasses } from "@/[locale]/brand";
import { businessThemeStyle } from "@/lib/theme";
import BrandMark from "@/[locale]/components/BrandMark";
import Reveal from "@/[locale]/components/landing/Reveal";
import BusinessGallery from "./components/BusinessGallery";
import BusinessHours from "./components/BusinessHours";
import BusinessPosts from "./components/BusinessPosts";
import OpenNow from "./components/OpenNow";
import { getInitials, getMapsUrl, getWhatsAppUrl, groupServicesByName } from "./lib/business-page.utils";
import LocaleSwitch from "@/[locale]/components/LocaleSwitch";

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

const primaryButton =
    "inline-flex min-h-12 items-center justify-center gap-2 bg-[var(--brand-primary)] px-6 font-semibold text-[var(--brand-on-primary)] transition-[opacity,transform] duration-150 hover:opacity-90 active:translate-y-px";
const secondaryButton =
    "inline-flex min-h-12 items-center justify-center gap-2 border border-[var(--brand-ink)] px-5 font-semibold transition-colors hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-[var(--brand-on-primary)]";
const sectionTitle = "brand-display text-[length:var(--step-head)]";

export default async function BusinessPage({ params }: BusinessPageProps) {
    const { locale, slug } = await params;

    // Los negocios suspendidos o cancelados no se muestran públicamente
    const business = await getPublicBusinessPage(slug);

    if (!business || !business.active) {
        notFound();
    }

    const t = await getTranslations("BusinessPage");
    const isServiceActive = business.settings?.isServiceActive ?? true;
    const bookUrl = `/${locale}/business/${business.slug}/book`;
    const hoursRows = business.barbers.flatMap((barber) => barber.availability);
    const hours = computeBusinessHours(hoursRows);

    // Solo se anuncian servicios que se pueden reservar: los de barberos con horario
    const bookableBarberIds = new Set(business.barbers.map((barber) => barber.id));
    const services = groupServicesByName(
        business.services.filter((service) => bookableBarberIds.has(service.barber.id)),
        t("team.fallbackName")
    ).sort((a, b) => a.minPriceCents - b.minPriceCents);

    const servicesPerBarber = new Map<string, number>();
    for (const service of business.services) {
        servicesPerBarber.set(service.barber.id, (servicesPerBarber.get(service.barber.id) ?? 0) + 1);
    }

    const whatsappUrl = business.phone ? getWhatsAppUrl(business.phone, t("hero.whatsappMessage", { name: business.name })) : null;
    const mapsUrl = business.address ? getMapsUrl(business.address) : null;
    const hasHours = hours.some((day) => day.open);

    const jsonLd = buildBarberShopJsonLd({
        url: `${getSiteUrl()}/${locale}/business/${business.slug}`,
        name: business.name,
        description: business.description,
        phone: business.phone,
        address: business.address,
        image: business.coverUrl || business.logoUrl,
        hours: hoursRows,
    });

    const price = (min: number, max: number) =>
        min === max ? formatPriceFromCents(min) : t("services.from", { price: formatPriceFromCents(min) });
    const duration = (min: number, max: number) =>
        min === max ? t("services.minutes", { min }) : t("services.minutesRange", { min, max });

    return (
        <main className={`brand ${brandFontClasses} min-h-screen pb-24 md:pb-0`} style={businessThemeStyle(business.themePrimary, business.themeAccent)}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

            <header className="sticky top-0 z-40 border-b border-[var(--brand-surface)] bg-[var(--brand-paper)]">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
                    <a href="#inicio" className="flex min-w-0 items-center gap-3">
                        {business.logoUrl ? (
                            <img src={business.logoUrl} alt="" className="h-9 w-9 shrink-0 object-cover" />
                        ) : (
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-[var(--brand-primary)] text-sm font-semibold text-[var(--brand-on-primary)]">
                                {getInitials(business.name)}
                            </span>
                        )}
                        <span className="truncate font-semibold">{business.name}</span>
                    </a>

                    <nav aria-label={t("nav.label")} className="flex items-center gap-1">
                        <a href="#servicios" className="hidden min-h-11 items-center px-3 text-[length:var(--step-small)] font-semibold lg:inline-flex">
                            {t("nav.services")}
                        </a>
                        {business.barbers.length > 0 && (
                            <a href="#equipo" className="hidden min-h-11 items-center px-3 text-[length:var(--step-small)] font-semibold lg:inline-flex">
                                {t("nav.team")}
                            </a>
                        )}
                        <a href="#ubicacion" className="hidden min-h-11 items-center px-3 text-[length:var(--step-small)] font-semibold lg:inline-flex">
                            {t("nav.visit")}
                        </a>
                        {isServiceActive && (
                            <Link href={bookUrl} className="ml-2 hidden min-h-11 items-center justify-center bg-[var(--brand-primary)] px-5 font-semibold text-[var(--brand-on-primary)] transition-opacity hover:opacity-90 md:inline-flex">
                                {t("nav.book")}
                            </Link>
                        )}
                        <LocaleSwitch className="ml-1" />
                    </nav>
                </div>
            </header>

            {/* Portada: lo primero que responde es quién es, dónde está y si se puede reservar */}
            <section id="inicio" className="mx-auto grid max-w-6xl gap-6 px-4 pb-12 pt-6 md:grid-cols-[1.05fr_1fr] md:items-center md:gap-10 md:px-8 md:pb-16 md:pt-12">
                <div className="order-2 md:order-1">
                    <h1 className="brand-display text-[length:var(--step-display)] [overflow-wrap:anywhere]">{business.name}</h1>

                    <p className="mt-4 max-w-[52ch] text-[var(--brand-muted)]">
                        {business.description || t("hero.defaultDescription")}
                    </p>

                    {hasHours && <OpenNow hours={hours} timezone={business.timezone} />}

                    {business.address && (
                        <p className="mt-3 flex items-start gap-2">
                            <MapPin size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
                            <span>{business.address}</span>
                        </p>
                    )}

                    {isServiceActive ? (
                        <div className="mt-7 flex flex-wrap gap-3">
                            <Link href={bookUrl} className={primaryButton}>
                                {t("hero.book")}
                                <ArrowRight size={18} aria-hidden="true" />
                            </Link>
                            {whatsappUrl && (
                                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={secondaryButton}>
                                    <MessageCircle size={18} aria-hidden="true" />
                                    {t("hero.whatsapp")}
                                </a>
                            )}
                        </div>
                    ) : (
                        <div className="mt-7 border-l-4 border-[var(--brand-accent)] bg-[var(--brand-paper)] p-4">
                            <p className="font-semibold">{t("hero.pausedTitle")}</p>
                            <p className="mt-1 text-[var(--brand-muted)]">{business.settings?.maintenanceMessage || t("hero.pausedText")}</p>
                            {whatsappUrl && (
                                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={`mt-4 ${secondaryButton}`}>
                                    <MessageCircle size={18} aria-hidden="true" />
                                    {t("hero.whatsapp")}
                                </a>
                            )}
                        </div>
                    )}
                </div>

                <div className="order-1 md:order-2">
                    {business.coverUrl ? (
                        <div className="aspect-[16/10] overflow-hidden bg-[var(--brand-surface)] md:aspect-[4/5] lg:aspect-[5/6]">
                            <img src={business.coverUrl} alt={t("hero.coverAlt", { name: business.name })} className="drift h-full w-full object-cover" />
                        </div>
                    ) : (
                        <div className="hidden aspect-[16/10] items-center justify-center bg-[var(--brand-field)] md:flex text-[var(--brand-field-ink)] md:aspect-[4/5] lg:aspect-[5/6]">
                            {business.logoUrl ? (
                                <img src={business.logoUrl} alt="" className="h-1/2 w-1/2 object-contain" />
                            ) : (
                                <span className="brand-display text-[clamp(4rem,12vw,9rem)]">{getInitials(business.name)}</span>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* Servicios y precios: la pregunta principal de quien llega a la página */}
            <section id="servicios" className="scroll-mt-20 bg-[var(--brand-paper)]">
                <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-[1fr_2fr] md:px-8 md:py-16">
                    <Reveal>
                        <h2 className={sectionTitle}>{t("services.title")}</h2>
                        <p className="mt-3 max-w-[36ch] text-[var(--brand-muted)]">{t("services.subtitle")}</p>
                    </Reveal>

                    {services.length === 0 ? (
                        <p className="text-[var(--brand-muted)]">{t("services.empty")}</p>
                    ) : (
                        <Reveal delay={80}>
                            <ul className="divide-y divide-[var(--brand-surface)] border-y border-[var(--brand-surface)]">
                                {services.map((service) => {
                                    const content = (
                                        <>
                                            <span className="min-w-0 flex-1">
                                                <span className="block font-semibold">{service.name}</span>
                                                <span className="mt-1 block text-[length:var(--step-small)] text-[var(--brand-muted)]">
                                                    {duration(service.minDuration, service.maxDuration)}
                                                    {business.barbers.length > 1 && ` · ${t("services.with", { names: service.barberNames.join(", ") })}`}
                                                </span>
                                            </span>
                                            <span className="tabular shrink-0 text-right font-semibold">
                                                {price(service.minPriceCents, service.maxPriceCents)}
                                            </span>
                                        </>
                                    );

                                    return (
                                        <li key={service.key}>
                                            {isServiceActive ? (
                                                <Link
                                                    href={`${bookUrl}?service=${encodeURIComponent(service.name)}`}
                                                    className="group flex min-h-16 items-center gap-4 py-4 transition-colors hover:bg-[var(--brand-bg)] md:px-3"
                                                    aria-label={t("services.bookLabel", { name: service.name })}
                                                >
                                                    {content}
                                                    <ArrowRight
                                                        size={18}
                                                        className="shrink-0 text-[var(--brand-muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--brand-ink)]"
                                                        aria-hidden="true"
                                                    />
                                                </Link>
                                            ) : (
                                                <div className="flex min-h-16 items-center gap-4 py-4 md:px-3">{content}</div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                            <p className="mt-4 text-[length:var(--step-small)] text-[var(--brand-muted)]">{t("services.note")}</p>
                        </Reveal>
                    )}
                </div>
            </section>

            {business.barbers.length > 0 && (
                <section id="equipo" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12 md:px-8 md:py-16">
                    <Reveal>
                        <h2 className={sectionTitle}>{t("team.title")}</h2>
                        <p className="mt-3 text-[var(--brand-muted)]">{t("team.subtitle")}</p>
                    </Reveal>

                    <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                        {business.barbers.map((barber, index) => {
                            const name = barber.user.name || t("team.fallbackName");
                            const card = (
                                <>
                                    <span className="block aspect-square overflow-hidden bg-[var(--brand-sand)]">
                                        {barber.profileImageUrl ? (
                                            <img
                                                src={barber.profileImageUrl}
                                                alt={name}
                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <span className="brand-display flex h-full w-full items-center justify-center text-[clamp(2.5rem,8vw,4rem)]">
                                                {getInitials(name)}
                                            </span>
                                        )}
                                    </span>
                                    <span className="mt-3 block font-semibold">{name}</span>
                                    <span className="block text-[length:var(--step-small)] text-[var(--brand-muted)]">
                                        {t("team.services", { count: servicesPerBarber.get(barber.id) ?? 0 })}
                                    </span>
                                </>
                            );

                            return (
                                <Reveal as="li" key={barber.id} delay={Math.min(index, 4) * 70}>
                                    {isServiceActive ? (
                                        <Link href={`${bookUrl}?barber=${barber.id}`} className="group block" aria-label={t("team.bookWith", { name })}>
                                            {card}
                                        </Link>
                                    ) : (
                                        <div>{card}</div>
                                    )}
                                </Reveal>
                            );
                        })}
                    </ul>
                </section>
            )}

            {/* Horario y cómo llegar */}
            <section id="ubicacion" className="scroll-mt-20 bg-[var(--brand-field)] text-[var(--brand-field-ink)]">
                <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-2 md:px-8 md:py-16">
                    <Reveal>
                        <h2 className={sectionTitle}>{t("visit.title")}</h2>

                        {business.address && (
                            <p className="mt-5 flex items-start gap-3 text-[length:var(--step-lead)]">
                                <MapPin size={24} className="mt-1 shrink-0 text-[var(--brand-accent)]" aria-hidden="true" />
                                <span>{business.address}</span>
                            </p>
                        )}

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                            {mapsUrl && (
                                <a
                                    href={mapsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex min-h-12 items-center justify-center gap-2 bg-[var(--brand-field-ink)] px-5 font-semibold text-[var(--brand-field)] transition-opacity hover:opacity-90"
                                >
                                    <MapPin size={18} aria-hidden="true" />
                                    {t("visit.map")}
                                </a>
                            )}
                            {business.phone && (
                                <a
                                    href={`tel:${business.phone.replace(/[^\d+]/g, "")}`}
                                    className="inline-flex min-h-12 items-center justify-center gap-2 border border-[var(--brand-field-ink)] px-5 font-semibold transition-colors hover:bg-[var(--brand-field-ink)] hover:text-[var(--brand-field)]"
                                >
                                    <Phone size={18} aria-hidden="true" />
                                    {t("visit.call", { phone: business.phone })}
                                </a>
                            )}
                        </div>
                    </Reveal>

                    {hasHours && (
                        <Reveal delay={80}>
                            <BusinessHours hours={hours} timezone={business.timezone} />
                        </Reveal>
                    )}
                </div>
            </section>

            {business.gallery.length > 0 && (
                <section id="galeria" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12 md:px-8 md:py-16">
                    <Reveal>
                        <h2 className={sectionTitle}>{t("gallery.title")}</h2>
                    </Reveal>
                    <BusinessGallery gallery={business.gallery.slice(0, 12)} />
                </section>
            )}

            {business.posts.length > 0 && (
                <section id="novedades" className="scroll-mt-20 bg-[var(--brand-paper)]">
                    <div className="mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-16">
                        <Reveal>
                            <h2 className={sectionTitle}>{t("posts.title")}</h2>
                        </Reveal>
                        <BusinessPosts posts={business.posts.slice(0, 6)} />
                    </div>
                </section>
            )}

            <footer className="border-t border-[var(--brand-surface)]">
                <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-[length:var(--step-small)] text-[var(--brand-muted)] sm:flex-row sm:items-center sm:justify-between md:px-8">
                    <p>
                        © {new Date().getFullYear()} {business.name}
                    </p>
                    <Link href={`/${locale}`} className="inline-flex min-h-11 items-center gap-2 font-semibold text-[var(--brand-ink)]">
                        <BrandMark iconClassName="h-7 w-7 bg-[var(--brand-ink)] text-[var(--brand-paper)]" iconSize={14} nameClassName="font-semibold" />
                        <span>{t("footer.platform")}</span>
                    </Link>
                </div>
            </footer>

            {/* En el teléfono la acción principal queda siempre a la mano */}
            {isServiceActive && (
                <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-[var(--brand-surface)] bg-[var(--brand-paper)] p-3 md:hidden">
                    <Link href={bookUrl} className={`flex-1 ${primaryButton}`}>
                        {t("hero.book")}
                    </Link>
                    {whatsappUrl && (
                        <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={t("hero.whatsapp")}
                            className="inline-flex h-12 w-12 shrink-0 items-center justify-center border border-[var(--brand-ink)]"
                        >
                            <MessageCircle size={20} aria-hidden="true" />
                        </a>
                    )}
                </div>
            )}
        </main>
    );
}

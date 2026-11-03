import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "../../../../i18n/routing";
import BrandMark from "@/[locale]/components/BrandMark";
import { BILLING_PLANS } from "@/lib/billing/pricing";
import { brandFontClasses } from "../../brand";
import BookingDemo from "./BookingDemo";
import { DemoStateProvider } from "./DemoState";
import HowItWorks from "./HowItWorks";
import Reveal from "./Reveal";

// Fotos de colecciones abiertas (se acreditan en el pie). Muestran Tijuana y el oficio, nunca a un cliente real.
const CREDITS = [
    { title: "Sunset Playas de Tijuana", author: "Cbojorquez75", licence: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/", url: "https://commons.wikimedia.org/w/index.php?curid=41451914" },
    { title: "Tijuana skyline", author: "Urbaner44", licence: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/", url: "https://commons.wikimedia.org/w/index.php?curid=104910998" },
    { title: "Barber Pole", author: "Elisabeth Fulda", licence: "CC0", licenceUrl: "https://creativecommons.org/publicdomain/zero/1.0/", url: "https://commons.wikimedia.org/w/index.php?curid=82159399" },
    { title: "Shaving with a Wacker straight razor", author: "Frank Schulenburg", licence: "CC0", licenceUrl: "https://creativecommons.org/publicdomain/zero/1.0/", url: "https://commons.wikimedia.org/w/index.php?curid=32725078" },
];

const FAQ_KEYS = ["app", "team", "closed", "double", "noshow", "english", "pay"] as const;
const INCLUDED_KEYS = ["page", "bookings", "team", "setup"] as const;

const sectionSpace = "mt-[clamp(6rem,16vh,11rem)]";

export default async function LandingPage({ locale }: { locale: string }) {
    const t = await getTranslations({ locale, namespace: "Landing" });
    const year = new Date().getFullYear();

    const plans = [
        { key: "founder" as const, cents: BILLING_PLANS.FOUNDER.monthlyPriceCents },
        { key: "basic" as const, cents: BILLING_PLANS.BASIC.monthlyPriceCents },
    ];

    const navLinks = [
        { href: "#como-funciona", label: t("nav.how") },
        { href: "#tijuana", label: t("nav.tijuana") },
        { href: "#precio", label: t("nav.pricing") },
        { href: "#preguntas", label: t("nav.faq") },
    ];

    return (
        <div className={`brand ${brandFontClasses} min-h-svh`}>
            <DemoStateProvider>
                <div className="lg:grid lg:grid-cols-[minmax(0,47%)_minmax(0,1fr)]">
                    {/* Mitad fija (escritorio): la página de reservas de ejemplo, siempre a la vista */}
                    <aside className="hidden lg:sticky lg:top-0 lg:block lg:h-svh lg:p-5">
                        <div className="flex h-full flex-col bg-[var(--brand-field)] p-8 text-[var(--brand-field-ink)] xl:p-12 [@media(max-height:820px)]:p-6">
                            <BrandMark
                                iconClassName="h-9 w-9 bg-[var(--brand-field-ink)] text-[var(--brand-field)]"
                                iconSize={18}
                            />
                            {/* Si la ventana es baja, el ejemplo se desplaza dentro del panel en lugar de cortarse */}
                            <div className="flex min-h-0 flex-1 overflow-y-auto py-4">
                                <div className="m-auto w-full max-w-[400px] [@media(min-height:741px)_and_(max-height:860px)]:[zoom:0.88] [@media(min-height:641px)_and_(max-height:740px)]:[zoom:0.78] [@media(max-height:640px)]:[zoom:0.66]">
                                    <BookingDemo />
                                </div>
                            </div>
                            <p className="text-[length:var(--step-small)] text-[var(--brand-field-muted)]">{t("demo.tryIt")}</p>
                        </div>
                    </aside>

                    {/* Columna de lectura */}
                    <div className="min-w-0 px-5 sm:px-8 lg:px-14 xl:px-20">
                        <header className="flex items-center justify-between gap-4 py-5 lg:justify-end lg:py-8">
                            <span className="lg:hidden">
                                <BrandMark
                                    iconClassName="h-9 w-9 bg-[var(--brand-ink)] text-[var(--brand-paper)]"
                                    iconSize={18}
                                />
                            </span>
                            <nav aria-label="Principal" className="flex items-center gap-5 text-[0.9375rem] lg:gap-7">
                                {navLinks.map((link) => (
                                    <a
                                        key={link.href}
                                        href={link.href}
                                        className="hidden underline-offset-4 transition-colors hover:underline xl:inline"
                                    >
                                        {link.label}
                                    </a>
                                ))}
                                <Link href="/login" className="underline-offset-4 hover:underline">
                                    {t("nav.login")}
                                </Link>
                                <Link
                                    href="/register"
                                    className="hidden min-h-10 items-center bg-[var(--brand-ink)] px-4 font-semibold text-[var(--brand-paper)] transition-opacity hover:opacity-90 sm:inline-flex"
                                >
                                    {t("nav.start")}
                                </Link>
                            </nav>
                        </header>

                        <main>
                            {/* Primer pantallazo: qué es, para quién y cuánto cuesta */}
                            <section className="flex flex-col justify-center pb-12 pt-[6vh] lg:min-h-[calc(100svh-6rem)] lg:pb-24 lg:pt-0">
                                <h1 className="brand-display max-w-[16ch] text-[length:var(--step-display)]">{t("hero.title")}</h1>
                                <p className="mt-6 max-w-[34ch] text-[length:var(--step-lead)] leading-snug text-[var(--brand-muted)]">
                                    {t("hero.lead")}
                                </p>
                                <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
                                    <Link
                                        href="/register"
                                        className="inline-flex min-h-12 items-center bg-[var(--brand-ink)] px-6 font-semibold text-[var(--brand-paper)] transition-[opacity,transform] duration-150 hover:opacity-90 active:translate-y-px"
                                    >
                                        {t("hero.primary")}
                                    </Link>
                                    <Link href="/login" className="font-semibold underline underline-offset-4 hover:no-underline">
                                        {t("hero.secondary")}
                                    </Link>
                                </div>
                            </section>

                            {/* En el teléfono el ejemplo va justo después del primer pantallazo, a todo el ancho */}
                            <div className="-mx-5 flex justify-center bg-[var(--brand-field)] px-4 py-10 sm:-mx-8 lg:hidden">
                                <BookingDemo />
                            </div>

                            <div className={`${sectionSpace} lg:mt-0`}>
                                <HowItWorks />
                            </div>

                            {/* Tijuana: hora local, pesos, WhatsApp y dos idiomas */}
                            <section id="tijuana" aria-labelledby="tijuana-title" className={`${sectionSpace} scroll-mt-8`}>
                                <Reveal as="h2" className="text-[length:var(--step-head)] leading-tight tracking-tight">
                                    <span id="tijuana-title">{t("tijuana.title")}</span>
                                </Reveal>
                                <Reveal delay={80}>
                                    <p className="mt-5 max-w-[46ch]">{t("tijuana.text")}</p>
                                </Reveal>
                                <Reveal delay={160} className="relative mt-10 aspect-[16/10] overflow-hidden bg-[var(--brand-surface)]">
                                    <Image
                                        src="/landing/playas-de-tijuana.jpg"
                                        alt={t("tijuana.photoAlt")}
                                        fill
                                        sizes="(min-width: 1024px) 50vw, 100vw"
                                        className="drift object-cover"
                                    />
                                </Reveal>
                                <Reveal delay={80} className="relative mt-3 aspect-[21/8] overflow-hidden bg-[var(--brand-surface)]">
                                    <Image
                                        src="/landing/tijuana-panoramica.jpg"
                                        alt={t("tijuana.cityAlt")}
                                        fill
                                        sizes="(min-width: 1024px) 50vw, 100vw"
                                        className="object-cover object-[50%_45%]"
                                    />
                                </Reveal>
                            </section>

                            {/* El equipo del negocio */}
                            <section aria-labelledby="team-title" className={sectionSpace}>
                                <Reveal as="h2" className="text-[length:var(--step-head)] leading-tight tracking-tight">
                                    <span id="team-title">{t("team.title")}</span>
                                </Reveal>
                                <Reveal delay={80}>
                                    <p className="mt-5 max-w-[46ch]">{t("team.text")}</p>
                                </Reveal>
                                <div className="mt-10 grid grid-cols-2 gap-3">
                                    <Reveal delay={120} className="relative aspect-[4/5] overflow-hidden bg-[var(--brand-sand)]">
                                        <Image
                                            src="/landing/poste-de-barbero.jpg"
                                            alt={t("team.poleAlt")}
                                            fill
                                            sizes="(min-width: 1024px) 25vw, 50vw"
                                            className="object-cover object-[50%_22%]"
                                        />
                                    </Reveal>
                                    <Reveal delay={200} className="relative aspect-[4/5] overflow-hidden bg-[var(--brand-surface)]">
                                        <Image
                                            src="/landing/navaja.jpg"
                                            alt={t("team.razorAlt")}
                                            fill
                                            sizes="(min-width: 1024px) 25vw, 50vw"
                                            className="object-cover object-[55%_62%]"
                                        />
                                    </Reveal>
                                </div>
                            </section>

                            {/* Precio, puesto como un menú */}
                            <section id="precio" aria-labelledby="pricing-title" className={`${sectionSpace} scroll-mt-8`}>
                                <Reveal as="h2" className="text-[length:var(--step-head)] leading-tight tracking-tight">
                                    <span id="pricing-title">{t("pricing.title")}</span>
                                </Reveal>

                                <Reveal delay={80} className="mt-10">
                                    <h3 className="text-[1.375rem] font-semibold">{t("pricing.plansGroup")}</h3>
                                    <ul className="mt-5 space-y-6">
                                        {plans.map((plan) => (
                                            <li key={plan.key}>
                                                <div className="flex items-baseline justify-between gap-4 text-[1.1875rem]">
                                                    <span>{t(`pricing.${plan.key}.name`)}</span>
                                                    <span className="tabular shrink-0">
                                                        ${plan.cents / 100}
                                                        <span className="text-[var(--brand-muted)]"> MXN{t("pricing.perMonth")}</span>
                                                    </span>
                                                </div>
                                                <p className="mt-1 max-w-[36ch] text-[var(--brand-muted)]">{t(`pricing.${plan.key}.text`)}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </Reveal>

                                <Reveal delay={160} className="mt-12">
                                    <h3 className="text-[1.375rem] font-semibold">{t("pricing.includedGroup")}</h3>
                                    <ul className="mt-5 space-y-6">
                                        {INCLUDED_KEYS.map((key) => (
                                            <li key={key}>
                                                <div className="flex items-baseline justify-between gap-4 text-[1.1875rem]">
                                                    <span>{t(`pricing.included.${key}.name`)}</span>
                                                    <span className="tabular shrink-0 text-[var(--brand-muted)]">
                                                        {key === "setup" ? t("pricing.noCost") : t("pricing.free")}
                                                    </span>
                                                </div>
                                                <p className="mt-1 max-w-[36ch] text-[var(--brand-muted)]">{t(`pricing.included.${key}.text`)}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </Reveal>
                            </section>

                            {/* Preguntas como texto corrido: todo se lee de un vistazo */}
                            <section id="preguntas" aria-labelledby="faq-title" className={`${sectionSpace} scroll-mt-8`}>
                                <Reveal as="h2" className="text-[length:var(--step-head)] leading-tight tracking-tight">
                                    <span id="faq-title">{t("faq.title")}</span>
                                </Reveal>
                                <div className="mt-8 space-y-5">
                                    {FAQ_KEYS.map((key, index) => (
                                        <Reveal key={key} delay={Math.min(index, 4) * 60} as="p" className="max-w-[60ch] leading-[1.55]">
                                            <span className="font-semibold">{t(`faq.items.${key}.q`)}</span>{" "}
                                            {t(`faq.items.${key}.a`)}
                                        </Reveal>
                                    ))}
                                </div>
                            </section>

                            {/* Cierre: una frase y una acción */}
                            <section aria-label={t("cta.button")} className="pb-[16svh] pt-[24svh]">
                                <Reveal as="p" className="max-w-[34ch] text-[1.25rem] leading-snug">
                                    {t("cta.text")}
                                </Reveal>
                                <Reveal delay={80} className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                                    <Link
                                        href="/register"
                                        className="inline-flex min-h-11 items-center bg-[var(--brand-ink)] px-5 font-semibold text-[var(--brand-paper)] transition-[opacity,transform] duration-150 hover:opacity-90 active:translate-y-px"
                                    >
                                        {t("cta.button")}
                                    </Link>
                                    <Link href="/login" className="font-semibold underline underline-offset-4 hover:no-underline">
                                        {t("cta.login")}
                                    </Link>
                                </Reveal>
                            </section>
                        </main>

                        <footer className="pb-8 text-[length:var(--step-small)] text-[var(--brand-muted)]">
                            <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-baseline sm:gap-6">
                                <p>{t("footer.about")}</p>
                                <nav aria-label="Pie de página" className="flex flex-wrap gap-x-6 gap-y-1 text-[var(--brand-ink)]">
                                    <a href="#como-funciona" className="hover:underline">{t("footer.links.how")}</a>
                                    <a href="#precio" className="hover:underline">{t("footer.links.pricing")}</a>
                                    <a href="#preguntas" className="hover:underline">{t("footer.links.faq")}</a>
                                    <Link href="/login" className="hover:underline">{t("footer.links.login")}</Link>
                                </nav>
                                <p className="sm:text-right">{t("footer.rights", { year })}</p>
                            </div>
                            <p className="mt-6 max-w-[90ch] leading-relaxed">
                                {t("footer.credits")}:{" "}
                                {CREDITS.map((credit, index) => (
                                    <span key={credit.url}>
                                        <a href={credit.url} className="text-[var(--brand-ink)] underline underline-offset-2" rel="noopener noreferrer" target="_blank">
                                            “{credit.title}”
                                        </a>{" "}
                                        {credit.author},{" "}
                                        <a href={credit.licenceUrl} className="underline underline-offset-2" rel="noopener noreferrer" target="_blank">
                                            {credit.licence}
                                        </a>
                                        {index < CREDITS.length - 1 ? "; " : ", Wikimedia Commons."}
                                    </span>
                                ))}
                            </p>
                        </footer>
                    </div>
                </div>
            </DemoStateProvider>
        </div>
    );
}

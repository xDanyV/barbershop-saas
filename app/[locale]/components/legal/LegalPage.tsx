import { getTranslations } from "next-intl/server";
import { Link } from "../../../../i18n/routing";
import BrandMark from "@/[locale]/components/BrandMark";
import { LEGAL_INFO, TERMS_VERSION, isLegalInfoComplete } from "@/lib/legal";
import { getLegalDocument, type LegalKind } from "@/lib/legal-documents";
import { brandFontClasses } from "../../brand";
import LocaleSwitch from "@/[locale]/components/LocaleSwitch";

const OTHER: Record<LegalKind, { href: "/privacy" | "/terms" }> = {
    privacy: { href: "/terms" },
    terms: { href: "/privacy" },
};

// Documento legal en el estilo de la landing: una columna de lectura y un índice a la izquierda en escritorio
export default async function LegalPage({ kind, locale }: { kind: LegalKind; locale: string }) {
    const t = await getTranslations({ locale, namespace: "Legal" });
    const doc = getLegalDocument(kind, locale);

    const fill = (text: string) =>
        text
            .replaceAll("{name}", LEGAL_INFO.name ?? t("placeholders.name"))
            .replaceAll("{address}", LEGAL_INFO.address ?? t("placeholders.address"))
            .replaceAll("{email}", LEGAL_INFO.email ?? t("placeholders.email"));

    const updated = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    }).format(new Date(`${TERMS_VERSION}T12:00:00Z`));

    return (
        <div className={`brand ${brandFontClasses} min-h-svh`}>
            <header className="flex items-center justify-between px-5 py-5 sm:px-8 lg:px-14">
                <Link href="/" aria-label={t("back")}>
                    <BrandMark iconClassName="h-9 w-9 bg-[var(--brand-ink)] text-[var(--brand-paper)]" iconSize={18} />
                </Link>
                <div className="flex items-center gap-3">
                    <LocaleSwitch />
                    <Link href="/" className="text-[0.9375rem] underline-offset-4 hover:underline">
                        {t("back")}
                    </Link>
                </div>
            </header>

            <main className="px-5 pb-24 pt-10 sm:px-8 lg:grid lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:gap-16 lg:px-14 lg:pt-16">
                {/* Índice: en escritorio queda fijo a la izquierda mientras se lee */}
                <nav aria-label={t("contents")} className="hidden lg:block">
                    <div className="sticky top-10">
                        <p className="text-[length:var(--step-small)] font-semibold">{t("contents")}</p>
                        <ul className="mt-4 space-y-2.5 text-[0.9375rem] text-[var(--brand-muted)]">
                            {doc.sections.map((section) => (
                                <li key={section.id}>
                                    <a href={`#${section.id}`} className="hover:text-[var(--brand-ink)] hover:underline">
                                        {section.heading}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </nav>

                <article className="max-w-[68ch]">
                    <h1 className="brand-display text-[length:clamp(2rem,1.5rem+2.4vw,3.5rem)]">{doc.title}</h1>
                    <p className="mt-3 text-[length:var(--step-small)] text-[var(--brand-muted)]">{t("updated", { date: updated })}</p>

                    {!isLegalInfoComplete() && (
                        <p role="note" className="mt-8 bg-[var(--brand-sand)] px-5 py-4 text-[0.9375rem]">
                            {t("draft")}
                        </p>
                    )}

                    <p className="mt-8 text-[length:var(--step-lead)] leading-snug">{fill(doc.intro)}</p>

                    {doc.sections.map((section) => (
                        <section key={section.id} id={section.id} className="mt-14 scroll-mt-8">
                            <h2 className="text-[1.375rem] font-semibold leading-snug">{section.heading}</h2>
                            {section.paragraphs.map((paragraph, index) => (
                                <p key={index} className="mt-4 leading-[1.6]">
                                    {fill(paragraph)}
                                </p>
                            ))}
                        </section>
                    ))}

                    <p className="mt-16">
                        <Link href={OTHER[kind].href} className="font-semibold underline underline-offset-4 hover:no-underline">
                            {t(`other.${kind}`)}
                        </Link>
                    </p>
                </article>
            </main>
        </div>
    );
}

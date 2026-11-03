import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { brandFontClasses } from "../brand";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

// Página que ve todo el tráfico mientras MAINTENANCE_MODE=true (ver app/lib/maintenance.ts)
export default async function ComingSoonPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "ComingSoon" });

    return (
        <main className={`brand ${brandFontClasses} relative flex min-h-svh flex-col overflow-hidden`}>
            <header className="flex items-center justify-between px-4 pt-5 sm:px-5">
                <span className="text-[length:var(--step-small)] font-medium">Tijuana · Baja California</span>
            </header>

            {/* Campo naranja (78–82%) con el grito a la izquierda y la tarjeta de cita pegada como recorte de cartel */}
            <section className="relative flex-1 px-4 pt-[12svh] sm:px-5 sm:pt-[16svh]">
                <h1 className="brand-display whitespace-pre-line text-[13.5vw] leading-[0.9] sm:text-[clamp(64px,10vw,170px)]">
                    {t("headline")}
                </h1>

                <div
                    data-ui
                    aria-hidden="true"
                    className="absolute bottom-[-28px] right-[-6vw] w-[58vw] max-w-[420px] rotate-[5deg] bg-[var(--brand-sand)] px-5 pb-12 pt-12 sm:bottom-[-40px] sm:right-[10vw] sm:w-[max(26vw,280px)] sm:pb-16 sm:pt-16"
                    style={{ borderRadius: "999px 999px 0 0" }}
                >
                    <div className="text-center">
                        <p className="text-[length:var(--step-small)] font-medium text-[var(--brand-muted)]">{t("cardLabel")}</p>
                        <p className="brand-display mt-3 text-[clamp(1.75rem,4vw,3rem)]">4:00 PM</p>
                        <p className="mt-2 font-medium">{t("cardDetail")}</p>
                    </div>
                </div>
            </section>

            {/* Banda inferior negra: una frase y una sola acción */}
            <footer className="relative z-10 flex min-h-[22svh] flex-col gap-4 bg-[var(--brand-field)] px-4 py-6 text-[var(--brand-field-ink)] sm:min-h-[18svh] sm:flex-row sm:items-end sm:justify-between sm:px-5">
                <p className="max-w-[40ch] text-[length:var(--step-lead)] leading-snug">{t("lead")}</p>
                <a
                    href={`/${locale}`}
                    className="inline-flex min-h-12 items-center justify-center bg-[var(--brand-bg)] px-7 py-4 font-medium text-[var(--brand-ink)] transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-paper)] active:translate-y-0"
                >
                    {t("home")}
                </a>
            </footer>
        </main>
    );
}

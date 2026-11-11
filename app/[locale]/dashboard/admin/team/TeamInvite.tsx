"use client";

import { Copy, MessageCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { brandFontClasses } from "@/[locale]/brand";

// Enlace para que un barbero se registre ya unido a esta barbería, sin escribir nada a mano
export default function TeamInvite({ slug, businessName }: { slug: string; businessName: string }) {
    const t = useTranslations("TeamPage.invite");
    const locale = useLocale();

    const link = () => `${window.location.origin}/${locale}/register?intent=barber&business=${slug}`;

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(link());
            toast.success(t("copied"));
        } catch {
            toast.error(t("copyFailed"));
        }
    };

    const share = () => {
        const text = t("message", { name: businessName, link: link() });
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    };

    const button = "inline-flex min-h-11 items-center justify-center gap-2 px-4 text-sm font-semibold transition-opacity hover:opacity-90";

    return (
        <section className={`brand ${brandFontClasses} p-5 sm:p-6`} style={{ background: "var(--brand-paper)" }}>
            <h2 className="text-[length:var(--step-lead)] font-semibold">{t("title")}</h2>
            <p className="mt-1 max-w-[60ch] text-[var(--brand-muted)]">{t("text")}</p>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:flex">
                <button type="button" onClick={share} className={`${button} bg-[var(--brand-ink)] text-[var(--brand-paper)]`}>
                    <MessageCircle size={18} aria-hidden="true" />
                    {t("share")}
                </button>
                <button type="button" onClick={copy} className={`${button} border border-[var(--brand-surface)]`}>
                    <Copy size={18} aria-hidden="true" />
                    {t("copy")}
                </button>
            </div>
        </section>
    );
}

"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { brandFontClasses } from "../../brand";

// Bloquea el panel hasta que la persona acepte la versión vigente de los Términos y el Aviso de Privacidad
export default function TermsPrompt() {
    const t = useTranslations("TermsPrompt");
    const locale = useLocale();
    const [saving, setSaving] = useState(false);

    const accept = async () => {
        setSaving(true);

        try {
            const res = await fetch("/api/protected/account/accept-terms", { method: "POST" });

            if (!res.ok) {
                toast.error(t("error"));
                return;
            }

            // Recarga completa: el layout del panel se vuelve a pedir con la sesión ya actualizada
            window.location.reload();
        } catch {
            toast.error(t("error"));
        } finally {
            setSaving(false);
        }
    };

    const logout = async () => {
        await fetch("/api/logout", { method: "POST" });
        window.location.href = `/${locale}/login`;
    };

    const link = (href: string) => {
        const Anchor = (chunks: React.ReactNode) => (
            <a href={`/${locale}${href}`} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2">
                {chunks}
            </a>
        );
        return Anchor;
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="terms-prompt-title"
            className="fixed inset-0 z-[100] flex items-end justify-center bg-[rgba(15,39,51,0.6)] p-4 sm:items-center"
        >
            <div className={`brand ${brandFontClasses} w-full max-w-md p-6 sm:p-8`}>
                <h2 id="terms-prompt-title" className="text-[length:var(--step-head)] leading-tight tracking-tight">
                    {t("title")}
                </h2>
                <p className="mt-4">
                    {t.rich("text", { terms: link("/terms"), privacy: link("/privacy") })}
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                    <button
                        type="button"
                        onClick={accept}
                        disabled={saving}
                        autoFocus
                        className="inline-flex min-h-12 items-center bg-[var(--brand-ink)] px-6 font-semibold text-[var(--brand-paper)] transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                        {t("accept")}
                    </button>
                    <button type="button" onClick={logout} className="font-semibold underline underline-offset-4 hover:no-underline">
                        {t("logout")}
                    </button>
                </div>
            </div>
        </div>
    );
}

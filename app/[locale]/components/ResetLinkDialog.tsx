"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import BrandDialog, { brandInput, brandPrimaryButton } from "@/[locale]/components/BrandDialog";
import { getWhatsAppUrl } from "@/[locale]/business/[slug]/lib/business-page.utils";

type Props = {
    name: string;
    phone?: string | null;
    token: string;
    expiresAt: string;
    onClose: () => void;
};

// Enlace de un solo uso recién creado: se copia o se manda por WhatsApp a la persona
export default function ResetLinkDialog({ name, phone, token, expiresAt, onClose }: Props) {
    const t = useTranslations("ResetLink");
    const locale = useLocale();
    const [copied, setCopied] = useState(false);

    const link = `${window.location.origin}/${locale}/reset-password?token=${token}`;
    const expires = new Date(expiresAt).toLocaleString(locale === "en" ? "en-US" : "es-MX", {
        weekday: "long",
        hour: "numeric",
        minute: "2-digit",
    });
    const hasPhone = (phone ?? "").replace(/\D/g, "").length >= 10;

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            toast.success(t("copied"));
        } catch {
            toast.error(t("copyFailed"));
        }
    };

    return (
        <BrandDialog title={t("title", { name })} subtitle={t("text", { expires })} closeLabel={t("close")} onClose={onClose}>
            <div className="flex flex-col gap-3">
                <label className="text-[length:var(--step-small)] font-semibold">
                    {t("linkLabel")}
                    <input readOnly value={link} onFocus={(event) => event.target.select()} className={`${brandInput} text-[length:var(--step-small)]`} />
                </label>

                {hasPhone && (
                    <a
                        href={getWhatsAppUrl(phone!, t("whatsapp", { name: name.split(" ")[0], link }))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${brandPrimaryButton} gap-2`}
                    >
                        <MessageCircle size={18} aria-hidden="true" />
                        {t("sendWhatsapp")}
                    </a>
                )}

                <button
                    type="button"
                    onClick={copy}
                    className={
                        hasPhone
                            ? "inline-flex min-h-12 items-center justify-center gap-2 border border-[var(--brand-ink)] px-6 font-semibold"
                            : `${brandPrimaryButton} gap-2`
                    }
                >
                    {copied ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
                    {t("copy")}
                </button>

                <p className="text-[length:var(--step-small)] text-[var(--brand-muted)]">{t("warning")}</p>
            </div>
        </BrandDialog>
    );
}

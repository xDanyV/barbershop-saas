import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { LEGAL_INFO } from "@/lib/legal";
import { getWhatsAppUrl } from "@/[locale]/business/[slug]/lib/business-page.utils";
import AuthShell, { authPrimaryButton, authSecondaryLink } from "../AuthShell";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "PasswordReset" });
    return { title: t("forgot.title") };
}

// Sin correo todavía: explica a quién pedirle un enlace para elegir una contraseña nueva
export default async function ForgotPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "PasswordReset" });
    const settings = await prisma.systemSettings.findUnique({ where: { id: "global" }, select: { supportPhone: true } });
    const supportUrl = settings?.supportPhone ? getWhatsAppUrl(settings.supportPhone, t("forgot.supportMessage")) : null;

    return (
        <AuthShell title={t("forgot.title")} text={t("forgot.text")}>
            <div className="space-y-5">
                <section className="border-l-2 border-[#e8603a] pl-4">
                    <h2 className="font-bold">{t("forgot.barberTitle")}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-gray-400">{t("forgot.barberText")}</p>
                </section>

                <section className="border-l-2 border-[#e8603a] pl-4">
                    <h2 className="font-bold">{t("forgot.otherTitle")}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-gray-400">
                        {supportUrl
                            ? t("forgot.otherText")
                            : LEGAL_INFO.email
                              ? t("forgot.otherEmail", { email: LEGAL_INFO.email })
                              : t("forgot.otherFallback")}
                    </p>
                </section>

                <div className="flex flex-col gap-3 pt-1">
                    {supportUrl && (
                        <a href={supportUrl} target="_blank" rel="noopener noreferrer" className={authPrimaryButton}>
                            <MessageCircle size={18} aria-hidden="true" />
                            {t("forgot.support")}
                        </a>
                    )}
                    <Link href={`/${locale}/login`} className={authSecondaryLink}>
                        {t("backToLogin")}
                    </Link>
                </div>
            </div>
        </AuthShell>
    );
}

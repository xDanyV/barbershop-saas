import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { findUsableResetToken } from "@/lib/auth/password-reset";
import AuthShell, { authPrimaryButton } from "../AuthShell";
import ResetPasswordForm from "./ResetPasswordForm";

type Props = {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ token?: string | string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "PasswordReset" });
    // El enlace lleva el token: que no se comparta con otros sitios
    return { title: t("reset.title"), referrer: "no-referrer" };
}

export default async function ResetPasswordPage({ params, searchParams }: Props) {
    const { locale } = await params;
    const { token } = await searchParams;
    const t = await getTranslations({ locale, namespace: "PasswordReset" });
    const value = typeof token === "string" ? token : "";
    const record = await findUsableResetToken(value);

    if (!record) {
        return (
            <AuthShell title={t("invalid.title")} text={t("invalid.text")}>
                <Link href={`/${locale}/forgot-password`} className={authPrimaryButton}>
                    {t("invalid.action")}
                </Link>
            </AuthShell>
        );
    }

    return (
        <AuthShell title={t("reset.title")} text={t("reset.text", { email: record.user.email })}>
            <ResetPasswordForm token={value} />
        </AuthShell>
    );
}

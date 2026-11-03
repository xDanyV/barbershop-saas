"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";

type Props = {
    initial: { name: string; email: string; phone: string };
    canDelete: boolean;
    acceptedOn: string | null;
    contactEmail: string | null;
};

const inputClass =
    "mt-2 block min-h-12 w-full border border-[var(--brand-surface)] bg-[var(--brand-paper)] px-4 text-[var(--brand-ink)] outline-none transition-colors focus:border-[var(--brand-ink)] disabled:bg-[var(--brand-surface)] disabled:text-[var(--brand-muted)]";
const primaryButton =
    "inline-flex min-h-12 items-center bg-[var(--brand-ink)] px-6 font-semibold text-[var(--brand-paper)] transition-[opacity,transform] duration-150 hover:opacity-90 active:translate-y-px disabled:opacity-50";

async function send(url: string, method: string, body: unknown) {
    const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
}

// Mi cuenta: rectificar datos, cambiar contraseña, consultar documentos y eliminar la cuenta
export default function AccountForms({ initial, canDelete, acceptedOn, contactEmail }: Props) {
    const t = useTranslations("Account");
    const locale = useLocale();

    const [profile, setProfile] = useState({ name: initial.name, phone: initial.phone });
    const [savingProfile, setSavingProfile] = useState(false);
    const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
    const [savingPassword, setSavingPassword] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [deleting, setDeleting] = useState(false);

    const saveProfile = async (e: FormEvent) => {
        e.preventDefault();
        setSavingProfile(true);
        const { ok, status } = await send("/api/protected/account", "PATCH", profile).catch(() => ({ ok: false, status: 0 }));
        setSavingProfile(false);

        if (ok) toast.success(t("profile.saved"));
        else toast.error(status === 409 ? t("profile.phoneTaken") : t("error"));
    };

    const savePassword = async (e: FormEvent) => {
        e.preventDefault();
        setSavingPassword(true);
        const { ok, status } = await send("/api/protected/account/password", "POST", passwords).catch(() => ({ ok: false, status: 0 }));
        setSavingPassword(false);

        if (ok) {
            toast.success(t("password.saved"));
            setPasswords({ currentPassword: "", newPassword: "" });
        } else {
            toast.error(status === 403 ? t("password.wrong") : t("error"));
        }
    };

    const deleteAccount = async (e: FormEvent) => {
        e.preventDefault();
        setDeleting(true);
        const { ok, status } = await send("/api/protected/account", "DELETE", { password: deletePassword }).catch(() => ({ ok: false, status: 0 }));

        if (ok) {
            window.location.href = `/${locale}`;
            return;
        }

        setDeleting(false);
        toast.error(status === 403 ? t("password.wrong") : t("error"));
    };

    return (
        <div className="mt-12 space-y-4">
            <Panel title={t("profile.title")}>
                <form onSubmit={saveProfile} className="grid gap-5 sm:grid-cols-2">
                    <label className="block sm:col-span-2">
                        <span className="text-[0.9375rem] font-semibold">{t("profile.name")}</span>
                        <input
                            className={inputClass}
                            value={profile.name}
                            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                            required
                            maxLength={100}
                            autoComplete="name"
                        />
                    </label>
                    <label className="block">
                        <span className="text-[0.9375rem] font-semibold">{t("profile.email")}</span>
                        <input className={inputClass} value={initial.email} disabled />
                        <span className="mt-1.5 block text-[length:var(--step-small)] text-[var(--brand-muted)]">{t("profile.emailHint")}</span>
                    </label>
                    <label className="block">
                        <span className="text-[0.9375rem] font-semibold">{t("profile.phone")}</span>
                        <input
                            className={inputClass}
                            value={profile.phone}
                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                            required
                            maxLength={20}
                            inputMode="tel"
                            autoComplete="tel"
                        />
                    </label>
                    <div className="sm:col-span-2">
                        <button type="submit" disabled={savingProfile} className={primaryButton}>
                            {savingProfile ? t("profile.saving") : t("profile.save")}
                        </button>
                    </div>
                </form>
            </Panel>

            <Panel title={t("password.title")}>
                <form onSubmit={savePassword} className="grid gap-5 sm:grid-cols-2">
                    <label className="block">
                        <span className="text-[0.9375rem] font-semibold">{t("password.current")}</span>
                        <input
                            type="password"
                            className={inputClass}
                            value={passwords.currentPassword}
                            onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                            required
                            autoComplete="current-password"
                        />
                    </label>
                    <label className="block">
                        <span className="text-[0.9375rem] font-semibold">{t("password.next")}</span>
                        <input
                            type="password"
                            className={inputClass}
                            value={passwords.newPassword}
                            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                            required
                            minLength={8}
                            maxLength={72}
                            autoComplete="new-password"
                        />
                        <span className="mt-1.5 block text-[length:var(--step-small)] text-[var(--brand-muted)]">{t("password.hint")}</span>
                    </label>
                    <div className="sm:col-span-2">
                        <button type="submit" disabled={savingPassword} className={primaryButton}>
                            {savingPassword ? t("password.saving") : t("password.save")}
                        </button>
                    </div>
                </form>
            </Panel>

            <Panel title={t("legal.title")}>
                <ul className="flex flex-wrap gap-x-8 gap-y-2">
                    <li>
                        <a href={`/${locale}/privacy`} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4 hover:no-underline">
                            {t("legal.privacy")}
                        </a>
                    </li>
                    <li>
                        <a href={`/${locale}/terms`} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4 hover:no-underline">
                            {t("legal.terms")}
                        </a>
                    </li>
                </ul>
                {acceptedOn && <p className="mt-4 text-[var(--brand-muted)]">{t("legal.accepted", { date: acceptedOn })}</p>}
            </Panel>

            <Panel title={t("danger.title")} tone="sand">
                {canDelete ? (
                    <form onSubmit={deleteAccount}>
                        <p className="max-w-[60ch]">{t("danger.text")}</p>
                        <label className="mt-6 block max-w-sm">
                            <span className="text-[0.9375rem] font-semibold">{t("danger.confirmLabel")}</span>
                            <input
                                type="password"
                                className={inputClass}
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                required
                                autoComplete="current-password"
                            />
                        </label>
                        <button
                            type="submit"
                            disabled={deleting || !deletePassword}
                            className="mt-6 inline-flex min-h-12 items-center bg-[#9f2d14] px-6 font-semibold text-[var(--brand-paper)] transition-[opacity,transform] duration-150 hover:opacity-90 active:translate-y-px disabled:opacity-50"
                        >
                            {deleting ? t("danger.deleting") : t("danger.button")}
                        </button>
                    </form>
                ) : (
                    <p className="max-w-[60ch]">
                        {t("danger.businessAccounts")}
                        {contactEmail ? (
                            <>
                                {" "}
                                <a href={`mailto:${contactEmail}`} className="font-semibold underline underline-offset-4">
                                    {contactEmail}
                                </a>
                            </>
                        ) : null}
                    </p>
                )}
            </Panel>
        </div>
    );
}

function Panel({ title, children, tone = "paper" }: { title: string; children: ReactNode; tone?: "paper" | "sand" }) {
    return (
        <section className={`p-6 sm:p-8 ${tone === "sand" ? "bg-[var(--brand-sand)]" : "bg-[var(--brand-paper)]"}`}>
            <h2 className="text-[1.375rem] font-semibold leading-snug">{title}</h2>
            <div className="mt-6">{children}</div>
        </section>
    );
}

"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { authPrimaryButton } from "../AuthShell";

const inputClass =
    "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-11 text-sm text-white placeholder:text-gray-600 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50";

export default function ResetPasswordForm({ token }: { token: string }) {
    const t = useTranslations("PasswordReset.reset");
    const locale = useLocale();
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [show, setShow] = useState(false);
    const [error, setError] = useState("");
    const [working, setWorking] = useState(false);
    const [done, setDone] = useState(false);

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        setError("");

        if (password.length < 8) return setError(t("errors.short"));
        if (password !== confirm) return setError(t("errors.mismatch"));

        setWorking(true);

        try {
            const res = await fetch("/api/password-reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword: password }),
            });

            if (res.ok) return setDone(true);

            setError(res.status === 410 ? t("errors.expired") : res.status === 429 ? t("errors.tooMany") : t("errors.generic"));
        } catch {
            setError(t("errors.generic"));
        } finally {
            setWorking(false);
        }
    };

    if (done) {
        return (
            <div className="space-y-4">
                <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                    {t("done")}
                </p>
                <Link href={`/${locale}/login`} className={authPrimaryButton}>
                    {t("goToLogin")}
                </Link>
            </div>
        );
    }

    return (
        <form onSubmit={submit} className="space-y-4">
            <div>
                <label htmlFor="new-password" className="mb-1.5 block text-xs font-medium text-gray-400">
                    {t("password")}
                </label>
                <div className="relative">
                    <input
                        id="new-password"
                        type={show ? "text" : "password"}
                        autoComplete="new-password"
                        minLength={8}
                        maxLength={72}
                        required
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className={inputClass}
                    />
                    <button
                        type="button"
                        onClick={() => setShow(!show)}
                        aria-label={show ? t("hide") : t("show")}
                        className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-gray-500 transition-colors hover:text-gray-300"
                    >
                        {show ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
                <p className="mt-1.5 text-xs text-gray-500">{t("hint")}</p>
            </div>

            <div>
                <label htmlFor="confirm-password" className="mb-1.5 block text-xs font-medium text-gray-400">
                    {t("confirm")}
                </label>
                <input
                    id="confirm-password"
                    type={show ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                    className={inputClass}
                />
            </div>

            {error && (
                <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                    {error}
                </p>
            )}

            <button type="submit" disabled={working} className={authPrimaryButton}>
                {working ? t("saving") : t("save")}
            </button>
        </form>
    );
}

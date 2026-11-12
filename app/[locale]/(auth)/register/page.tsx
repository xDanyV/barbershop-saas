"use client";

import { use, useState } from "react";
import { Eye, EyeOff, Scissors, Store, UserRound, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import BrandMark from "@/[locale]/components/BrandMark";
import { useApiError } from "@/[locale]/components/useApiError";
import { normalizeMxPhone } from "@/lib/phone";
import { safeRedirectPath } from "@/lib/safe-redirect";
import LocaleSwitch from "@/[locale]/components/LocaleSwitch";

type Path = "owner" | "barber" | "customer";

type SearchParams = { intent?: string; redirectTo?: string; business?: string };

const PATHS: { id: Path; icon: LucideIcon }[] = [
    { id: "owner", icon: Store },
    { id: "barber", icon: Scissors },
    { id: "customer", icon: UserRound },
];

const inputClass =
    "mt-2 block min-h-12 w-full rounded-xl border border-white/10 bg-[#16323f] px-4 text-white placeholder:text-gray-600 outline-none transition-colors focus:border-white/50";

// Adónde lleva cada camino al terminar. Un dueño sigue directo a crear su barbería.
const HOME_BY_PATH: Record<Path, string> = {
    owner: "/dashboard/business/new",
    barber: "/dashboard/barber",
    customer: "/dashboard/customer/home",
};

export default function RegisterPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
    const params = use(searchParams);
    const t = useTranslations("Register");
    const locale = useLocale();
    const apiError = useApiError();

    const redirectTo = safeRedirectPath(params.redirectTo);
    const initialPath: Path | null = redirectTo
        ? "customer"
        : params.intent === "owner" || params.intent === "barber" || params.intent === "customer"
            ? params.intent
            : params.business
                ? "barber"
                : null;

    const [path, setPath] = useState<Path | null>(initialPath);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [form, setForm] = useState({
        name: "",
        phone: "",
        email: "",
        password: "",
        confirmPassword: "",
        businessSlug: params.business ?? "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!path) return setError(t("errors.selectType"));
        if (path === "barber" && !form.businessSlug.trim()) return setError(t("errors.slugRequired"));
        if (!normalizeMxPhone(form.phone)) return setError(t("errors.phone"));
        if (form.password.length < 8) return setError(t("errors.passwordLength"));
        if (form.password !== form.confirmPassword) return setError(t("errors.passwordMismatch"));
        if (!acceptedTerms) return setError(t("errors.acceptTerms"));

        setError("");
        setLoading(true);

        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: form.name,
                    email: form.email,
                    phone: form.phone,
                    password: form.password,
                    businessSlug: path === "barber" ? form.businessSlug : undefined,
                    acceptTerms: acceptedTerms,
                    // Un dueño empieza como cliente y se vuelve dueño al crear su barbería
                    role: path === "barber" ? "BARBER" : "CUSTOMER",
                }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                setError(apiError(data, t("errors.generic")));
                setLoading(false);
                return;
            }

            // El registro ya deja la sesión iniciada
            const home = data?.role === "ADMIN" ? "/dashboard/admin" : HOME_BY_PATH[path];
            window.location.assign(redirectTo ?? `/${locale}${home}`);
        } catch {
            setError(t("errors.connection"));
            setLoading(false);
        }
    };

    const showChooser = !redirectTo;

    return (
        <main className="theme-field flex min-h-screen items-center justify-center bg-[#0f2733] px-4 py-8 text-white md:py-16">
            <LocaleSwitch tone="dark" className="fixed right-2 top-2 z-20" />
            <div className={`w-full ${showChooser ? "max-w-5xl" : "max-w-xl"}`}>
                <div className="mb-8 text-center">
                    <Link href={`/${locale}`} className="inline-block">
                        <BrandMark iconClassName="h-12 w-12 rounded-xl bg-[#e4dccb] text-[#0f2733]" iconSize={22} />
                    </Link>
                </div>

                <div className={`grid items-start gap-6 ${showChooser ? "lg:grid-cols-2" : ""}`}>
                    {showChooser && (
                        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 md:p-8">
                            <h2 className="text-2xl font-semibold tracking-tight">{t("choosePath")}</h2>

                            <div role="radiogroup" aria-label={t("choosePath")} className="mt-5 space-y-3">
                                {PATHS.map(({ id, icon: Icon }) => {
                                    const selected = path === id;

                                    return (
                                        <button
                                            key={id}
                                            type="button"
                                            role="radio"
                                            aria-checked={selected}
                                            onClick={() => setPath(id)}
                                            className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-colors ${selected ? "border-[#e8957c] bg-white/10" : "border-white/10 hover:border-white/30"}`}
                                        >
                                            <Icon size={22} aria-hidden="true" className="mt-0.5 shrink-0 text-[#e4dccb]" />
                                            <span className="min-w-0 flex-1">
                                                <span className="block font-semibold">{t(`paths.${id}.title`)}</span>
                                                <span className="mt-1 block text-sm text-gray-400">{t(`paths.${id}.text`)}</span>
                                            </span>
                                            <span aria-hidden="true" className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${selected ? "border-[#e8957c]" : "border-gray-600"}`}>
                                                {selected && <span className="h-2.5 w-2.5 rounded-full bg-[#e8957c]" />}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 md:p-8">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {redirectTo ? t("returning.title") : path ? t(`paths.${path}.formTitle`) : t("accountDetails")}
                        </h1>
                        <p className="mt-2 text-sm text-gray-400">{redirectTo ? t("returning.text") : t("accountDetailsDesc")}</p>

                        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                            <div className="grid gap-5 md:grid-cols-2">
                                <label className="block text-sm font-semibold text-gray-300">
                                    {t("form.fullName")}
                                    <input name="name" type="text" autoComplete="name" required placeholder={t("placeholders.name")} value={form.name} onChange={handleChange} className={inputClass} />
                                </label>
                                <label className="block text-sm font-semibold text-gray-300">
                                    {t("form.phone")}
                                    <input name="phone" type="tel" inputMode="tel" autoComplete="tel-national" required placeholder="664 123 4567" value={form.phone} onChange={handleChange} className={inputClass} />
                                </label>
                            </div>

                            <label className="block text-sm font-semibold text-gray-300">
                                {t("form.email")}
                                <input name="email" type="email" autoComplete="email" required placeholder={t("placeholders.email")} value={form.email} onChange={handleChange} className={inputClass} />
                            </label>

                            {path === "barber" && (
                                <label className="block text-sm font-semibold text-gray-300">
                                    {t("form.businessSlug")}
                                    <input name="businessSlug" type="text" required placeholder={t("placeholders.businessLink")} value={form.businessSlug} onChange={handleChange} className={inputClass} />
                                    <span className="mt-2 block text-xs font-normal text-gray-400">{t("form.businessSlugHint")}</span>
                                </label>
                            )}

                            <div className="grid gap-5 md:grid-cols-2">
                                <label className="block text-sm font-semibold text-gray-300">
                                    {t("form.password")}
                                    <span className="relative block">
                                        <input name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} value={form.password} onChange={handleChange} className={`${inputClass} pr-12`} />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((value) => !value)}
                                            aria-label={showPassword ? t("form.hidePassword") : t("form.showPassword")}
                                            className="absolute right-0 top-0 flex h-12 w-12 items-center justify-center text-gray-400 hover:text-white"
                                        >
                                            {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                                        </button>
                                    </span>
                                    <span className="mt-2 block text-xs font-normal text-gray-400">{t("form.passwordHint")}</span>
                                </label>
                                <label className="block text-sm font-semibold text-gray-300">
                                    {t("form.confirmPassword")}
                                    <input name="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" required value={form.confirmPassword} onChange={handleChange} className={inputClass} />
                                </label>
                            </div>

                            <label className="flex items-start gap-3 text-sm leading-relaxed text-gray-400">
                                <input
                                    type="checkbox"
                                    name="acceptTerms"
                                    checked={acceptedTerms}
                                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                                    required
                                    className="mt-1 h-4 w-4 shrink-0 accent-[#e8603a]"
                                />
                                <span>
                                    {t.rich("form.acceptTerms", {
                                        terms: (chunks) => (
                                            <a href={`/${locale}/terms`} target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-2">
                                                {chunks}
                                            </a>
                                        ),
                                        privacy: (chunks) => (
                                            <a href={`/${locale}/privacy`} target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-2">
                                                {chunks}
                                            </a>
                                        ),
                                    })}
                                </span>
                            </label>

                            {error && (
                                <p role="alert" className="rounded-xl border border-red-300/40 bg-red-500/15 px-4 py-3 text-sm text-white">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !path}
                                className="flex min-h-12 w-full items-center justify-center rounded-xl bg-indigo-600 px-4 font-semibold text-white transition-colors hover:bg-indigo-700 disabled:bg-white/10 disabled:text-gray-400"
                            >
                                {loading ? t("buttons.creating") : !path ? t("buttons.selectRole") : t(`paths.${path}.submit`)}
                            </button>
                        </form>
                    </section>
                </div>

                <p className="mt-8 text-center text-sm text-gray-400">
                    {t("login.question")}{" "}
                    <Link
                        href={`/${locale}/login${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`}
                        className="font-semibold text-white underline underline-offset-4"
                    >
                        {t("login.action")}
                    </Link>
                </p>
            </div>
        </main>
    );
}

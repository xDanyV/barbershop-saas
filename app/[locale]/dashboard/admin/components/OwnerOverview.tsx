"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Circle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { brandFontClasses } from "@/[locale]/brand";
import { formatPriceFromCents } from "@/lib/billing/pricing";
import type { RankedItem } from "@/lib/business-metrics";

type Overview = {
    slug: string;
    checklist: { profile: boolean; services: boolean; hours: boolean; firstBooking: boolean };
    metrics: {
        today: number;
        nextSevenDays: number;
        pendingToConfirm: number;
        month: { attended: number; incomeCents: number; customers: number; previousAttended: number; previousIncomeCents: number };
        noShows: { count: number; percent: number | null };
        topServices: RankedItem[];
        byBarber: RankedItem[];
    };
};

const STEP_LINKS: Record<"profile" | "services" | "hours", string> = {
    profile: "/dashboard/admin/my-business",
    services: "/dashboard/barber/catalog",
    hours: "/dashboard/barber",
};

const actionClass =
    "inline-flex min-h-11 shrink-0 items-center border border-[var(--brand-surface)] px-4 text-[length:var(--step-small)] font-semibold transition-colors hover:border-[var(--brand-ink)]";

export default function OwnerOverview() {
    const t = useTranslations("OwnerOverview");
    const locale = useLocale();
    const [data, setData] = useState<Overview | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let ignore = false;

        fetch("/api/protected/businesses/me/overview")
            .then((res) => (res.ok ? res.json() : Promise.reject(new Error("load"))))
            .then((result: Overview) => {
                if (!ignore) setData(result);
            })
            .catch(() => {
                if (!ignore) setFailed(true);
            });

        return () => {
            ignore = true;
        };
    }, []);

    if (failed) {
        return <p className="py-10 text-center text-gray-500">{t("error")}</p>;
    }

    if (!data) {
        return <p className="py-10 text-center text-gray-500">{t("loading")}</p>;
    }

    const { checklist, metrics } = data;
    const steps = (["profile", "services", "hours", "firstBooking"] as const).map((id) => ({ id, done: checklist[id] }));
    const completed = steps.filter((step) => step.done).length;

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(`${window.location.origin}/${locale}/business/${data.slug}`);
            toast.success(t("linkCopied"));
        } catch {
            toast.error(t("linkFailed"));
        }
    };

    const money = (cents: number) => formatPriceFromCents(cents);

    const activity = [
        { label: t("stats.today"), value: metrics.today, note: t("stats.pending", { count: metrics.pendingToConfirm }) },
        { label: t("stats.nextSeven"), value: metrics.nextSevenDays, note: t("stats.nextSevenNote") },
    ];

    const results = [
        { label: t("stats.attended"), value: String(metrics.month.attended), note: t("stats.lastMonth", { value: String(metrics.month.previousAttended) }) },
        { label: t("stats.income"), value: money(metrics.month.incomeCents), note: t("stats.lastMonth", { value: money(metrics.month.previousIncomeCents) }) },
        { label: t("stats.customers"), value: String(metrics.month.customers), note: t("stats.customersNote") },
        {
            label: t("stats.noShows"),
            value: metrics.noShows.percent === null ? "–" : `${metrics.noShows.percent}%`,
            note: t("stats.noShowsNote", { count: metrics.noShows.count }),
        },
    ];

    return (
        <section className={`brand ${brandFontClasses} p-5 pb-24 sm:p-8 md:pb-8`}>
            {completed < steps.length && (
                <div className="mb-8 p-5 sm:p-6" style={{ background: "var(--brand-paper)" }}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                        <h2 className="brand-display text-[length:var(--step-head)]">{t("setup.title")}</h2>
                        <p className="tabular font-semibold">{t("setup.progress", { done: completed, total: steps.length })}</p>
                    </div>
                    <p className="mt-2 max-w-[60ch] text-[var(--brand-muted)]">{t("setup.subtitle")}</p>

                    <ol className="mt-5 divide-y divide-[var(--brand-surface)]">
                        {steps.map((step) => (
                            <li key={step.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                                <div className="flex min-w-0 gap-3">
                                    <span className="mt-1 shrink-0">
                                        {step.done ? <Check size={18} aria-hidden="true" /> : <Circle size={18} aria-hidden="true" className="text-[var(--brand-muted)]" />}
                                    </span>
                                    <div className="min-w-0">
                                        <h3 className={`font-semibold ${step.done ? "text-[var(--brand-muted)]" : ""}`}>
                                            {t(`setup.steps.${step.id}.title`)}
                                            {step.done && <span className="sr-only"> ({t("setup.done")})</span>}
                                        </h3>
                                        {!step.done && <p className="mt-0.5 text-[var(--brand-muted)]">{t(`setup.steps.${step.id}.text`)}</p>}
                                    </div>
                                </div>

                                {!step.done &&
                                    (step.id === "firstBooking" ? (
                                        <button type="button" onClick={copyLink} className={`${actionClass} self-start sm:self-auto`}>
                                            {t("setup.copyLink")}
                                        </button>
                                    ) : (
                                        <Link href={`/${locale}${STEP_LINKS[step.id]}`} className={`${actionClass} self-start sm:self-auto`}>
                                            {t(`setup.steps.${step.id}.action`)}
                                        </Link>
                                    ))}
                            </li>
                        ))}
                    </ol>
                </div>
            )}

            <h2 className="brand-display text-[length:var(--step-head)]">{t("title")}</h2>

            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                {activity.map((stat) => (
                    <StatTile key={stat.label} {...stat} />
                ))}
            </dl>

            <h3 className="mt-8 text-[length:var(--step-lead)] font-semibold">{t("monthTitle")}</h3>

            <dl className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {results.map((stat) => (
                    <StatTile key={stat.label} {...stat} />
                ))}
            </dl>

            <p className="mt-3 max-w-[70ch] text-[length:var(--step-small)] text-[var(--brand-muted)]">{t("incomeNote")}</p>

            <div className="mt-8 grid gap-3 lg:grid-cols-2">
                <RankedList title={t("topServices")} items={metrics.topServices} empty={t("noData")} />
                <RankedList title={t("byBarber")} items={metrics.byBarber} empty={t("noData")} fallback={t("barberFallback")} />
            </div>
        </section>
    );
}

function StatTile({ label, value, note }: { label: string; value: string | number; note: string }) {
    return (
        <div className="min-w-0 p-4" style={{ background: "var(--brand-paper)" }}>
            <dt className="text-[length:var(--step-small)] text-[var(--brand-muted)]">{label}</dt>
            <dd className="tabular mt-1 text-[length:var(--step-head)] font-semibold leading-tight">{value}</dd>
            <dd className="mt-1 text-[length:var(--step-small)] text-[var(--brand-muted)]">{note}</dd>
        </div>
    );
}

// Una sola serie y el valor escrito en cada fila: la barra solo ayuda a comparar de un vistazo
function RankedList({ title, items, empty, fallback }: { title: string; items: RankedItem[]; empty: string; fallback?: string }) {
    const max = Math.max(1, ...items.map((item) => item.count));

    return (
        <div className="p-5" style={{ background: "var(--brand-paper)" }}>
            <h3 className="font-semibold">{title}</h3>

            {items.length === 0 ? (
                <p className="mt-2 text-[var(--brand-muted)]">{empty}</p>
            ) : (
                <ul className="mt-3 space-y-3">
                    {items.map((item) => (
                        <li key={item.key}>
                            <div className="flex items-baseline justify-between gap-4 text-[length:var(--step-small)]">
                                <span className="truncate">{item.label ?? fallback}</span>
                                <span className="tabular shrink-0 font-semibold">{item.count}</span>
                            </div>
                            <div
                                aria-hidden="true"
                                className="mt-1 h-1.5 rounded-r bg-[var(--brand-ink)]"
                                style={{ width: `${Math.max(2, (item.count / max) * 100)}%` }}
                            />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

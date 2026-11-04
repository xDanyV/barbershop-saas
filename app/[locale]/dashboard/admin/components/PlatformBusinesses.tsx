"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { BusinessBillingStatus, BusinessPlanType } from "@prisma/client";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { brandFontClasses } from "@/[locale]/brand";
import { getWhatsAppUrl } from "@/[locale]/business/[slug]/lib/business-page.utils";
import BrandDialog, { brandInput, brandPrimaryButton } from "@/[locale]/components/BrandDialog";

type BusinessRow = {
    id: string;
    name: string;
    slug: string;
    phone: string | null;
    active: boolean;
    createdAt: string;
    owner: { name: string | null; email: string; phone: string };
    subscription: { billingStatus: BusinessBillingStatus; plan: BusinessPlanType } | null;
    _count: { barbers: number; services: number };
    appointmentsLast30Days: number;
};

type Stats = { businesses: number; active: number; customers: number; appointmentsLast30Days: number };

const linkButton =
    "inline-flex min-h-11 items-center border border-[var(--brand-surface)] px-4 text-[length:var(--step-small)] font-semibold transition-colors hover:border-[var(--brand-ink)]";

export default function PlatformBusinesses() {
    const t = useTranslations("Platform");
    const tBilling = useTranslations("Billing");
    const locale = useLocale();
    const [data, setData] = useState<{ businesses: BusinessRow[]; stats: Stats } | null>(null);
    const [query, setQuery] = useState("");
    const [toggling, setToggling] = useState<BusinessRow | null>(null);

    const load = useCallback(async () => {
        const res = await fetch("/api/admin/businesses").catch(() => null);

        if (!res?.ok) {
            toast.error(t("errors.load"));
            setData((prev) => prev ?? { businesses: [], stats: { businesses: 0, active: 0, customers: 0, appointmentsLast30Days: 0 } });
            return;
        }

        setData(await res.json());
    }, [t]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial desde la API
        load();
    }, [load]);

    const visible = useMemo(() => {
        const term = query.trim().toLowerCase();
        const rows = data?.businesses ?? [];

        if (!term) return rows;

        return rows.filter((business) =>
            [business.name, business.slug, business.owner.name ?? "", business.owner.email, business.owner.phone]
                .some((value) => value.toLowerCase().includes(term))
        );
    }, [data, query]);

    const formatDate = (date: string) =>
        new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-MX", { day: "numeric", month: "short", year: "numeric" }).format(new Date(date));

    const stats = data
        ? [
            { label: t("stats.businesses"), value: data.stats.businesses },
            { label: t("stats.active"), value: data.stats.active },
            { label: t("stats.customers"), value: data.stats.customers },
            { label: t("stats.appointments"), value: data.stats.appointmentsLast30Days },
        ]
        : [];

    return (
        <section className={`brand ${brandFontClasses} p-5 pb-24 sm:p-8 md:pb-8`}>
            <h2 className="brand-display text-[length:var(--step-head)]">{t("title")}</h2>
            <p className="mt-2 max-w-[60ch] text-[var(--brand-muted)]">{t("subtitle")}</p>

            <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {stats.map((stat) => (
                    <div key={stat.label} className="p-4" style={{ background: "var(--brand-paper)" }}>
                        <dt className="text-[length:var(--step-small)] text-[var(--brand-muted)]">{stat.label}</dt>
                        <dd className="tabular mt-1 text-[length:var(--step-lead)] font-semibold">{stat.value}</dd>
                    </div>
                ))}
            </dl>

            <label className="mt-6 block font-semibold">
                {t("search")}
                <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("searchPlaceholder")}
                    className={brandInput}
                />
            </label>

            {data === null ? (
                <p className="mt-8 text-[var(--brand-muted)]">{tBilling("card.loading")}</p>
            ) : visible.length === 0 ? (
                <p className="mt-8 text-[var(--brand-muted)]">{query ? t("noResults") : t("empty")}</p>
            ) : (
                <ul className="mt-6 space-y-3">
                    {visible.map((business) => (
                        <li key={business.id} className="p-4 sm:p-5" style={{ background: "var(--brand-paper)" }}>
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div className="min-w-0">
                                    <h3 className="truncate font-semibold">{business.name}</h3>
                                    <p className="truncate text-[length:var(--step-small)] text-[var(--brand-muted)]">
                                        {business.owner.name || business.owner.email} · {business.owner.email}
                                    </p>
                                    <p className="mt-2 text-[length:var(--step-small)]">
                                        <span className="font-semibold">
                                            {business.active
                                                ? tBilling(`status.${business.subscription?.billingStatus ?? "ACTIVE"}`)
                                                : t("deactivated")}
                                        </span>
                                        <span className="text-[var(--brand-muted)]">
                                            {" · "}
                                            {t("since", { date: formatDate(business.createdAt) })}
                                        </span>
                                    </p>
                                    <p className="text-[length:var(--step-small)] text-[var(--brand-muted)]">
                                        {t("counts", {
                                            barbers: business._count.barbers,
                                            services: business._count.services,
                                            appointments: business.appointmentsLast30Days,
                                        })}
                                    </p>
                                </div>

                                <div className="flex shrink-0 flex-wrap gap-2">
                                    <a
                                        href={`/${locale}/business/${business.slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={linkButton}
                                    >
                                        {t("viewPage")}
                                    </a>
                                    <a
                                        href={getWhatsAppUrl(business.owner.phone)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={linkButton}
                                    >
                                        {t("whatsapp")}
                                    </a>
                                    <button type="button" onClick={() => setToggling(business)} className={linkButton}>
                                        {business.active ? t("deactivate") : t("activate")}
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {toggling && (
                <ToggleDialog
                    business={toggling}
                    onClose={() => setToggling(null)}
                    onDone={() => {
                        setToggling(null);
                        load();
                    }}
                />
            )}
        </section>
    );
}

function ToggleDialog({ business, onClose, onDone }: { business: BusinessRow; onClose: () => void; onDone: () => void }) {
    const t = useTranslations("Platform");
    const [reason, setReason] = useState("");
    const [saving, setSaving] = useState(false);
    const deactivating = business.active;

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch(`/api/admin/businesses/${business.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ active: !deactivating, reason }),
            });

            if (!res.ok) {
                toast.error(t("errors.toggle"));
                return;
            }

            toast.success(deactivating ? t("deactivatedToast") : t("activatedToast"));
            onDone();
        } catch {
            toast.error(t("errors.toggle"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <BrandDialog
            title={deactivating ? t("deactivateTitle", { name: business.name }) : t("activateTitle", { name: business.name })}
            subtitle={deactivating ? t("deactivateHint") : t("activateHint")}
            closeLabel={t("close")}
            onClose={() => !saving && onClose()}
        >
            <form onSubmit={submit} className="space-y-5">
                <label className="block font-semibold">
                    {t("reason")}
                    <input maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} className={brandInput} />
                </label>

                <button type="submit" disabled={saving} className={brandPrimaryButton}>
                    {saving ? t("saving") : deactivating ? t("deactivate") : t("activate")}
                </button>
            </form>
        </BrandDialog>
    );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { brandFontClasses } from "@/[locale]/brand";
import { formatPriceFromCents } from "@/lib/billing/pricing";

type Entry = {
    id: string;
    action: string;
    targetType: string;
    targetLabel: string | null;
    metadata: { amountCents?: number; months?: number; status?: string; plan?: string; reason?: string; fields?: string[] } | null;
    createdAt: string;
    actorName: string | null;
};

export default function AuditLogList() {
    const t = useTranslations("Platform.audit");
    const tBilling = useTranslations("Billing");
    const locale = useLocale();
    const [entries, setEntries] = useState<Entry[] | null>(null);
    const [cursor, setCursor] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);

    const load = useCallback(
        async (from: string | null) => {
            const res = await fetch(`/api/admin/audit${from ? `?cursor=${from}` : ""}`).catch(() => null);

            if (!res?.ok) {
                toast.error(t("error"));
                setEntries((prev) => prev ?? []);
                return;
            }

            const data: { entries: Entry[]; nextCursor: string | null } = await res.json();
            setEntries((prev) => (from ? [...(prev ?? []), ...data.entries] : data.entries));
            setCursor(data.nextCursor);
        },
        [t]
    );

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial desde la API
        load(null);
    }, [load]);

    const loadMore = async () => {
        setLoadingMore(true);
        await load(cursor);
        setLoadingMore(false);
    };

    const formatDate = (date: string) =>
        new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-MX", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        }).format(new Date(date));

    const detail = (entry: Entry) => {
        const meta = entry.metadata;

        if (!meta) return null;
        if (meta.reason) return meta.reason;
        if (meta.amountCents !== undefined) return formatPriceFromCents(meta.amountCents);
        if (meta.status && meta.plan) return `${tBilling(`status.${meta.status}` as never)} · ${tBilling(`plans.${meta.plan}` as never)}`;

        return null;
    };

    const target = (entry: Entry) => {
        if (entry.targetType === "settings") return null;
        return entry.targetLabel ?? t("removedAccount");
    };

    return (
        <section className={`brand ${brandFontClasses} p-5 sm:p-8`}>
            <h2 className="brand-display text-[length:var(--step-head)]">{t("title")}</h2>
            <p className="mt-2 max-w-[60ch] text-[var(--brand-muted)]">{t("subtitle")}</p>

            {entries === null ? (
                <p className="mt-8 text-[var(--brand-muted)]">{tBilling("card.loading")}</p>
            ) : entries.length === 0 ? (
                <p className="mt-8 text-[var(--brand-muted)]">{t("empty")}</p>
            ) : (
                <ul className="mt-6 divide-y divide-[var(--brand-surface)] px-4 sm:px-5" style={{ background: "var(--brand-paper)" }}>
                    {entries.map((entry) => (
                        <li key={entry.id} className="py-4">
                            <p className="font-semibold">
                                {t(`actions.${entry.action}` as never)}
                                {target(entry) && <span className="font-normal"> · {target(entry)}</span>}
                            </p>
                            {detail(entry) && <p className="text-[length:var(--step-small)]">{detail(entry)}</p>}
                            <p className="mt-1 text-[length:var(--step-small)] text-[var(--brand-muted)]">
                                {entry.actorName ?? t("system")} · {formatDate(entry.createdAt)}
                            </p>
                        </li>
                    ))}
                </ul>
            )}

            {cursor && (
                <button
                    type="button"
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="mt-4 min-h-11 border border-[var(--brand-surface)] px-5 text-[length:var(--step-small)] font-semibold transition-colors hover:border-[var(--brand-ink)] disabled:opacity-50"
                >
                    {loadingMore ? tBilling("card.loading") : t("more")}
                </button>
            )}
        </section>
    );
}

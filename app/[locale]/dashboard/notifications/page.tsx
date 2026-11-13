"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CalendarCheck, CalendarClock, CalendarPlus, CalendarX, CircleCheck, Star, UserPlus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import PageHeader from "@/[locale]/components/PageHeader";

type Item = {
    id: string;
    event: string;
    title: string;
    body: string;
    url: string;
    read: boolean;
    createdAt: string;
};

const ICONS: Record<string, typeof Bell> = {
    booked: CalendarPlus,
    requested: CalendarPlus,
    confirmed: CalendarCheck,
    reminder: Bell,
    cancelledByCustomer: CalendarX,
    cancelledByBusiness: CalendarX,
    rescheduledByCustomer: CalendarClock,
    rescheduledByBusiness: CalendarClock,
    newReview: Star,
    barberRequest: UserPlus,
    barberReady: CircleCheck,
    barberReadyTeam: CircleCheck,
};

// Bandeja: lo mismo que llega como notificación push, para revisarlo cuando quieras
export default function NotificationsPage() {
    const t = useTranslations("Inbox");
    const locale = useLocale();
    const [items, setItems] = useState<Item[] | null>(null);
    const [cursor, setCursor] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [failed, setFailed] = useState(false);

    const fetchPage = useCallback(
        async (after: string | null) => {
            const res = await fetch(`/api/protected/notifications?locale=${locale}${after ? `&cursor=${after}` : ""}`);
            if (!res.ok) throw new Error("load");
            return (await res.json()) as { items: Item[]; nextCursor: string | null };
        },
        [locale]
    );

    useEffect(() => {
        fetchPage(null)
            .then((data) => {
                setItems(data.items);
                setCursor(data.nextCursor);
                // Al abrir la bandeja todo queda leído; la campana se actualiza
                if (data.items.some((item) => !item.read)) {
                    fetch("/api/protected/notifications", { method: "POST" })
                        .then(() => window.dispatchEvent(new Event("inbox-read")))
                        .catch(() => null);
                }
            })
            .catch(() => {
                setItems([]);
                setFailed(true);
            });
    }, [fetchPage]);

    const loadMore = async () => {
        if (!cursor) return;
        setLoadingMore(true);
        try {
            const data = await fetchPage(cursor);
            setItems((prev) => [...(prev ?? []), ...data.items]);
            setCursor(data.nextCursor);
        } finally {
            setLoadingMore(false);
        }
    };

    const when = (iso: string) => {
        const date = new Date(iso);
        const minutes = Math.round((Date.now() - date.getTime()) / 60000);
        const rtf = new Intl.RelativeTimeFormat(locale === "en" ? "en" : "es", { numeric: "auto" });
        if (minutes < 60) return rtf.format(-Math.max(minutes, 0), "minute");
        if (minutes < 24 * 60) return rtf.format(-Math.round(minutes / 60), "hour");
        if (minutes < 7 * 24 * 60) return rtf.format(-Math.round(minutes / (24 * 60)), "day");
        return date.toLocaleDateString(locale === "en" ? "en-US" : "es-MX", { day: "numeric", month: "short" });
    };

    return (
        <div className="mx-auto max-w-2xl pb-6">
            <PageHeader title={t("title")} subtitle={t("subtitle")} />

            {items === null ? (
                <div className="space-y-2" aria-busy="true">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-20 animate-pulse bg-gray-200/60" />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="border border-dashed border-gray-300 bg-white p-8 text-center">
                    <Bell size={24} className="mx-auto text-gray-400" aria-hidden="true" />
                    <p className="mt-3 font-semibold text-gray-900">{failed ? t("failed") : t("emptyTitle")}</p>
                    {!failed && <p className="mx-auto mt-1 max-w-sm text-gray-600">{t("emptyText")}</p>}
                </div>
            ) : (
                <>
                    <ul className="divide-y divide-gray-200 border-y border-gray-200 bg-white">
                        {items.map((item) => {
                            const Icon = ICONS[item.event] ?? Bell;

                            return (
                                <li key={item.id}>
                                    <Link href={item.url} className="flex gap-3 p-4 transition-colors hover:bg-[#f1f3f2]">
                                        <span
                                            className={`flex h-10 w-10 shrink-0 items-center justify-center ${item.read ? "bg-[#f1f3f2] text-gray-500" : "bg-[#0f2733] text-white"}`}
                                            aria-hidden="true"
                                        >
                                            <Icon size={18} />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="flex items-start justify-between gap-3">
                                                <span className={`break-words ${item.read ? "font-medium text-gray-800" : "font-semibold text-gray-900"}`}>
                                                    {item.title}
                                                    {!item.read && <span className="sr-only"> ({t("new")})</span>}
                                                </span>
                                                <span className="shrink-0 text-xs text-gray-500">{when(item.createdAt)}</span>
                                            </span>
                                            <span className="mt-0.5 block break-words text-sm text-gray-600">{item.body}</span>
                                        </span>
                                        {!item.read && <span className="mt-2 h-2 w-2 shrink-0 bg-[#e8603a]" aria-hidden="true" />}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                    {cursor && (
                        <button
                            type="button"
                            onClick={loadMore}
                            disabled={loadingMore}
                            className="mt-4 inline-flex min-h-11 items-center border border-gray-300 bg-white px-4 text-sm font-semibold hover:border-gray-900 disabled:opacity-50"
                        >
                            {t("more")}
                        </button>
                    )}
                </>
            )}
        </div>
    );
}

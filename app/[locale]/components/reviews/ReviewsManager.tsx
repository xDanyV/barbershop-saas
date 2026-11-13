"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, MessageSquareReply, Star } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { useApiError } from "@/[locale]/components/useApiError";

type Review = {
    id: string;
    rating: number;
    comment: string | null;
    hidden: boolean;
    reply: string | null;
    createdAt: string;
    customer: string;
    barber: string | null;
    service: string;
};

type Props = {
    // Dueño: puede apagar las reseñas de toda la barbería y ve las de todo el equipo
    owner?: boolean;
};

function Stars({ value }: { value: number }) {
    return (
        <span className="inline-flex shrink-0 items-center gap-0.5" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} size={14} className={n <= value ? "fill-[#e8603a] text-[#e8603a]" : "text-[#c9d2d4]"} />
            ))}
        </span>
    );
}

// Moderar reseñas: ocultar las que no deben verse en la página, responder y (dueño) apagarlas
export default function ReviewsManager({ owner = false }: Props) {
    const t = useTranslations("ReviewsManager");
    const locale = useLocale();
    const apiError = useApiError();
    const [reviews, setReviews] = useState<Review[] | null>(null);
    const [enabled, setEnabled] = useState<boolean | null>(null);
    const [replying, setReplying] = useState<string | null>(null);
    const [draft, setDraft] = useState("");
    const [working, setWorking] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/protected/reviews")
            .then((res) => (res.ok ? res.json() : Promise.reject(new Error("load"))))
            .then((data: Review[]) => setReviews(data))
            .catch(() => {
                setReviews([]);
                toast.error(t("errors.load"));
            });

        if (owner) {
            fetch("/api/protected/businesses/me")
                .then((res) => (res.ok ? res.json() : null))
                .then((data) => setEnabled(data?.settings?.reviewsEnabled ?? true))
                .catch(() => setEnabled(true));
        }
    }, [owner, t]);

    const toggleEnabled = async () => {
        const next = !enabled;
        setWorking("settings");
        try {
            const res = await fetch("/api/protected/businesses/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reviewsEnabled: next }),
            });
            if (!res.ok) throw new Error();
            setEnabled(next);
            toast.success(next ? t("enabledOn") : t("enabledOff"));
        } catch {
            toast.error(t("errors.save"));
        } finally {
            setWorking(null);
        }
    };

    const patch = async (review: Review, change: { hidden?: boolean; reply?: string | null }) => {
        setWorking(review.id);
        try {
            const res = await fetch(`/api/protected/reviews/${review.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(change),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) {
                toast.error(apiError(data, t("errors.save")));
                return false;
            }
            setReviews((prev) => (prev ?? []).map((r) => (r.id === review.id ? { ...r, hidden: data.hidden, reply: data.reply } : r)));
            return true;
        } catch {
            toast.error(t("errors.save"));
            return false;
        } finally {
            setWorking(null);
        }
    };

    const visible = (reviews ?? []).filter((r) => !r.hidden);
    const average = visible.length ? visible.reduce((sum, r) => sum + r.rating, 0) / visible.length : 0;
    const dateLabel = (iso: string) => new Date(iso).toLocaleDateString(locale === "en" ? "en-US" : "es-MX", { day: "numeric", month: "short", year: "numeric" });

    return (
        <div className="space-y-6">
            {owner && enabled !== null && (
                <section className="border border-gray-200 bg-white p-5">
                    <button
                        type="button"
                        role="switch"
                        aria-checked={enabled}
                        onClick={toggleEnabled}
                        disabled={working === "settings"}
                        className="flex w-full items-center justify-between gap-4 text-left disabled:opacity-60"
                    >
                        <span>
                            <span className="block font-semibold text-gray-900">{t("enabledLabel")}</span>
                            <span className="mt-0.5 block text-sm text-gray-600">{enabled ? t("enabledOnHint") : t("enabledOffHint")}</span>
                        </span>
                        <span aria-hidden="true" className={`relative h-7 w-12 shrink-0 transition-colors ${enabled ? "bg-[#2f7d5b]" : "bg-gray-300"}`}>
                            <span className={`absolute top-1 h-5 w-5 bg-white transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`} />
                        </span>
                    </button>
                </section>
            )}

            <section className="border border-gray-200 bg-white p-5">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">{owner ? t("titleOwner") : t("titleBarber")}</h2>
                        <p className="mt-1 text-sm text-gray-600">{t("hint")}</p>
                    </div>
                    {visible.length > 0 && (
                        <p className="flex items-center gap-2 text-gray-900">
                            <span className="text-2xl font-semibold tabular-nums">{average.toFixed(1)}</span>
                            <Stars value={Math.round(average)} />
                            <span className="text-sm text-gray-500">{t("count", { count: visible.length })}</span>
                        </p>
                    )}
                </div>

                {reviews === null ? (
                    <p className="mt-6 text-gray-600">{t("loading")}</p>
                ) : reviews.length === 0 ? (
                    <div className="mt-6 border border-dashed border-gray-300 p-6 text-center">
                        <p className="font-semibold text-gray-900">{t("emptyTitle")}</p>
                        <p className="mx-auto mt-1 max-w-md text-gray-600">{t("emptyText")}</p>
                    </div>
                ) : (
                    <ul className="mt-5 divide-y divide-gray-100 border-y border-gray-100">
                        {reviews.map((review) => (
                            <li key={review.id} className={`py-4 ${review.hidden ? "opacity-60" : ""}`}>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                    <Stars value={review.rating} />
                                    <span className="sr-only">{t("starsLabel", { rating: review.rating })}</span>
                                    <span className="font-semibold text-gray-900">{review.customer || t("anonymous")}</span>
                                    <span className="text-sm text-gray-500">{dateLabel(review.createdAt)}</span>
                                    {review.hidden && <span className="bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">{t("hiddenBadge")}</span>}
                                </div>
                                <p className="mt-1 text-sm text-gray-500">
                                    {review.service}
                                    {owner && review.barber ? `, ${t("with", { barber: review.barber })}` : ""}
                                </p>
                                {review.comment && <p className="mt-2 whitespace-pre-line break-words text-gray-900">{review.comment}</p>}

                                {review.reply && replying !== review.id && (
                                    <div className="mt-3 border-l-2 border-[#e8603a] pl-3">
                                        <p className="text-sm font-semibold text-gray-900">{t("yourReply")}</p>
                                        <p className="mt-0.5 whitespace-pre-line break-words text-sm text-gray-700">{review.reply}</p>
                                    </div>
                                )}

                                {replying === review.id ? (
                                    <form
                                        className="mt-3 space-y-2"
                                        onSubmit={async (event) => {
                                            event.preventDefault();
                                            if (await patch(review, { reply: draft.trim() || null })) {
                                                setReplying(null);
                                                toast.success(draft.trim() ? t("replied") : t("replyRemoved"));
                                            }
                                        }}
                                    >
                                        <label className="block text-sm font-semibold text-gray-900">
                                            {t("replyLabel")}
                                            <textarea
                                                value={draft}
                                                onChange={(event) => setDraft(event.target.value)}
                                                rows={3}
                                                maxLength={500}
                                                className="mt-1 block w-full resize-y border border-gray-200 bg-white px-3 py-2 font-normal outline-none focus:border-gray-900"
                                            />
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            <button type="submit" disabled={working === review.id} className="inline-flex min-h-11 items-center bg-gray-900 px-4 text-sm font-semibold text-white disabled:opacity-50">
                                                {t("saveReply")}
                                            </button>
                                            <button type="button" onClick={() => setReplying(null)} className="inline-flex min-h-11 items-center px-3 text-sm font-semibold text-gray-700">
                                                {t("cancel")}
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="mt-2 flex flex-wrap gap-x-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setReplying(review.id);
                                                setDraft(review.reply ?? "");
                                            }}
                                            className="inline-flex min-h-11 items-center gap-1.5 px-1 text-sm font-semibold text-gray-900"
                                        >
                                            <MessageSquareReply size={16} aria-hidden="true" />
                                            {review.reply ? t("editReply") : t("reply")}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                if (await patch(review, { hidden: !review.hidden })) toast.success(review.hidden ? t("shown") : t("hidden"));
                                            }}
                                            disabled={working === review.id}
                                            className="inline-flex min-h-11 items-center gap-1.5 px-1 text-sm font-semibold text-gray-700 disabled:opacity-50"
                                        >
                                            {review.hidden ? <Eye size={16} aria-hidden="true" /> : <EyeOff size={16} aria-hidden="true" />}
                                            {review.hidden ? t("show") : t("hide")}
                                        </button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}

"use client";

import { useState, type FormEvent } from "react";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import BrandDialog, { brandPrimaryButton } from "@/[locale]/components/BrandDialog";
import { useApiError } from "@/[locale]/components/useApiError";

type Props = {
    appointmentId: string;
    service: string;
    business: string;
    initialRating?: number;
    onClose: () => void;
    onDone: (rating: number) => void;
};

// El cliente califica una cita atendida: estrellas obligatorias, comentario opcional
export default function RateDialog({ appointmentId, service, business, initialRating = 0, onClose, onDone }: Props) {
    const t = useTranslations("RateDialog");
    const apiError = useApiError();
    const [rating, setRating] = useState(initialRating);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState("");
    const [saving, setSaving] = useState(false);

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (!rating) return;
        setSaving(true);

        try {
            const res = await fetch("/api/protected/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ appointmentId, rating, comment: comment.trim() || null }),
            });
            const data = await res.json().catch(() => null);

            if (!res.ok) {
                toast.error(apiError(data, t("failed")));
                return;
            }

            toast.success(t("thanks"));
            onDone(rating);
        } catch {
            toast.error(t("failed"));
        } finally {
            setSaving(false);
        }
    };

    const shown = hover || rating;

    return (
        <BrandDialog title={t("title")} subtitle={t("subtitle", { service, business })} closeLabel={t("close")} onClose={() => !saving && onClose()}>
            <form onSubmit={submit} className="space-y-5">
                <fieldset>
                    <legend className="font-semibold">{t("stars")}</legend>
                    <div className="mt-2 flex gap-1" onMouseLeave={() => setHover(0)}>
                        {[1, 2, 3, 4, 5].map((n) => (
                            <label key={n} className="cursor-pointer" onMouseEnter={() => setHover(n)}>
                                <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} className="peer sr-only" />
                                <span className="flex h-12 w-12 items-center justify-center peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--brand-ink)]">
                                    <Star
                                        size={32}
                                        aria-hidden="true"
                                        className={n <= shown ? "fill-[#e8603a] text-[#e8603a]" : "text-[#c9d2d4]"}
                                    />
                                </span>
                                <span className="sr-only">{t("starLabel", { count: n })}</span>
                            </label>
                        ))}
                    </div>
                    <p className="mt-1 min-h-6 text-[length:var(--step-small)] text-[var(--brand-muted)]" aria-live="polite">
                        {shown ? t(`level${shown}`) : ""}
                    </p>
                </fieldset>

                <label className="block font-semibold">
                    {t("comment")}
                    <textarea
                        value={comment}
                        onChange={(event) => setComment(event.target.value)}
                        rows={3}
                        maxLength={500}
                        placeholder={t("commentPlaceholder")}
                        className="mt-2 block w-full resize-y border border-[var(--brand-surface)] bg-[var(--brand-paper)] px-4 py-3 font-normal outline-none focus:border-[var(--brand-ink)]"
                    />
                </label>
                <p className="text-[length:var(--step-small)] text-[var(--brand-muted)]">{t("public")}</p>

                <button type="submit" disabled={!rating || saving} className={brandPrimaryButton}>
                    {saving ? t("sending") : t("send")}
                </button>
            </form>
        </BrandDialog>
    );
}

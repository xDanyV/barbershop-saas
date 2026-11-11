"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import BrandDialog, { brandPrimaryButton } from "@/[locale]/components/BrandDialog";
import { useApiError } from "@/[locale]/components/useApiError";

// Lunes primero, como se lee un horario en México (0 = domingo)
const WEEK = [
    { key: "mon", value: 1 },
    { key: "tue", value: 2 },
    { key: "wed", value: 3 },
    { key: "thu", value: 4 },
    { key: "fri", value: 5 },
    { key: "sat", value: 6 },
    { key: "sun", value: 0 },
] as const;

type Day = { open: boolean; start: string; end: string; hasBreak: boolean; breakStart: string; breakEnd: string };

const DEFAULT_DAY: Day = { open: false, start: "09:00", end: "19:00", hasBreak: false, breakStart: "14:00", breakEnd: "15:00" };

type Row = { dayOfWeek: number; startTime: string; endTime: string; breakStart: string | null; breakEnd: string | null };

const timeInput =
    "min-h-11 w-full border border-[var(--brand-surface)] bg-[var(--brand-paper)] px-2 text-[var(--brand-ink)] outline-none focus:border-[var(--brand-ink)]";

// Horario semanal del barbero: cada día con sus propias horas y, si quiere, un descanso
export default function AvailabilityModal() {
    const t = useTranslations("AvailabilityModal");
    const apiError = useApiError();
    const [isOpen, setIsOpen] = useState(false);
    const [week, setWeek] = useState<Record<number, Day> | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        let ignore = false;

        fetch("/api/protected/availability")
            .then((res) => (res.ok ? res.json() : []))
            .catch(() => [])
            .then((rows: Row[]) => {
                if (ignore) return;

                const next: Record<number, Day> = {};

                for (const { value } of WEEK) {
                    const row = rows.find((r) => r.dayOfWeek === value);
                    next[value] = row
                        ? {
                            open: true,
                            start: row.startTime,
                            end: row.endTime,
                            hasBreak: Boolean(row.breakStart && row.breakEnd),
                            breakStart: row.breakStart ?? DEFAULT_DAY.breakStart,
                            breakEnd: row.breakEnd ?? DEFAULT_DAY.breakEnd,
                        }
                        : { ...DEFAULT_DAY };
                }

                setWeek(next);
            });

        return () => {
            ignore = true;
        };
    }, [isOpen]);

    const update = (day: number, patch: Partial<Day>) => setWeek((prev) => (prev ? { ...prev, [day]: { ...prev[day], ...patch } } : prev));

    // Copia el horario de un día a los demás días abiertos
    const copyToOpenDays = (from: number) =>
        setWeek((prev) => {
            if (!prev) return prev;

            const source = prev[from];
            const next = { ...prev };

            for (const { value } of WEEK) {
                if (value !== from && next[value].open) next[value] = { ...source };
            }

            return next;
        });

    const validate = (current: Record<number, Day>) => {
        for (const { key, value } of WEEK) {
            const day = current[value];
            if (!day.open) continue;

            const name = t(`daysLong.${key}`);
            if (day.start >= day.end) return t("errors.endBeforeStartDay", { day: name });
            if (day.hasBreak && day.breakStart >= day.breakEnd) return t("errors.breakEndBeforeStartDay", { day: name });
            if (day.hasBreak && (day.breakStart < day.start || day.breakEnd > day.end)) return t("errors.breakOutOfRangeDay", { day: name });
        }

        return null;
    };

    const save = async () => {
        if (!week) return;

        const problem = validate(week);
        if (problem) return void toast.error(problem);

        const days = WEEK.filter(({ value }) => week[value].open).map(({ value }) => {
            const day = week[value];
            return {
                dayOfWeek: value,
                startTime: day.start,
                endTime: day.end,
                breakStart: day.hasBreak ? day.breakStart : null,
                breakEnd: day.hasBreak ? day.breakEnd : null,
            };
        });

        setSaving(true);

        try {
            const res = await fetch("/api/protected/availability", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ days }),
            });

            if (!res.ok) {
                toast.error(apiError(await res.json().catch(() => null), t("errors.saveFailed")));
                return;
            }

            toast.success(days.length === 0 ? t("success.closed") : t("success.saved"));
            setIsOpen(false);
        } catch {
            toast.error(t("errors.saveFailed"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="flex min-h-11 items-center justify-center gap-2 border border-gray-200 bg-white px-4 text-sm font-semibold transition-colors hover:border-gray-900"
            >
                <Clock size={18} aria-hidden="true" />
                {t("triggerButton")}
            </button>

            {isOpen && (
                <BrandDialog title={t("title")} subtitle={t("subtitle")} closeLabel={t("buttons.cancel")} onClose={() => !saving && setIsOpen(false)}>
                    {week === null ? (
                        <p className="text-[var(--brand-muted)]">{t("loading")}</p>
                    ) : (
                        <>
                            <ul className="max-h-[60svh] divide-y divide-[var(--brand-surface)] overflow-y-auto overflow-x-hidden pr-3">
                                {WEEK.map(({ key, value }) => {
                                    const day = week[value];

                                    return (
                                        <li key={value} className="py-3">
                                            <div className="flex min-h-11 items-center justify-between gap-3">
                                                <label className="flex items-center gap-3 font-semibold">
                                                    <input
                                                        type="checkbox"
                                                        checked={day.open}
                                                        onChange={(e) => update(value, { open: e.target.checked })}
                                                        className="h-5 w-5 accent-[#0f2733]"
                                                    />
                                                    {t(`daysLong.${key}`)}
                                                </label>
                                                {!day.open && <span className="shrink-0 text-[length:var(--step-small)] text-[var(--brand-muted)]">{t("closed")}</span>}
                                                {day.open && (
                                                    <button
                                                        type="button"
                                                        onClick={() => copyToOpenDays(value)}
                                                        className="min-h-11 shrink-0 text-right text-[length:var(--step-small)] font-semibold underline underline-offset-4"
                                                    >
                                                        {t("copyToOthers")}
                                                    </button>
                                                )}
                                            </div>

                                            {day.open && (
                                                <div className="mt-2 space-y-2 pl-8">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <label className="text-[length:var(--step-small)] text-[var(--brand-muted)]">
                                                            {t("labels.shiftStart")}
                                                            <input type="time" step={1800} value={day.start} onChange={(e) => update(value, { start: e.target.value })} className={timeInput} />
                                                        </label>
                                                        <label className="text-[length:var(--step-small)] text-[var(--brand-muted)]">
                                                            {t("labels.shiftEnd")}
                                                            <input type="time" step={1800} value={day.end} onChange={(e) => update(value, { end: e.target.value })} className={timeInput} />
                                                        </label>
                                                    </div>

                                                    {day.hasBreak ? (
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <label className="text-[length:var(--step-small)] text-[var(--brand-muted)]">
                                                                {t("labels.breakStart")}
                                                                <input type="time" step={1800} value={day.breakStart} onChange={(e) => update(value, { breakStart: e.target.value })} className={timeInput} />
                                                            </label>
                                                            <label className="text-[length:var(--step-small)] text-[var(--brand-muted)]">
                                                                {t("labels.breakEnd")}
                                                                <input type="time" step={1800} value={day.breakEnd} onChange={(e) => update(value, { breakEnd: e.target.value })} className={timeInput} />
                                                            </label>
                                                            <button
                                                                type="button"
                                                                onClick={() => update(value, { hasBreak: false })}
                                                                className="col-span-2 min-h-11 text-left text-[length:var(--step-small)] font-semibold underline underline-offset-4"
                                                            >
                                                                {t("removeBreak")}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => update(value, { hasBreak: true })}
                                                            className="min-h-11 text-[length:var(--step-small)] font-semibold underline underline-offset-4"
                                                        >
                                                            {t("addBreak")}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>

                            <button type="button" onClick={save} disabled={saving} className={`mt-4 ${brandPrimaryButton}`}>
                                {saving ? t("buttons.saving") : t("buttons.save")}
                            </button>
                        </>
                    )}
                </BrandDialog>
            )}
        </>
    );
}

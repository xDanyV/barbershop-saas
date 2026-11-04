"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import BrandDialog, { brandInput, brandPrimaryButton } from "./BrandDialog";

type Slot = { start: string; label: string };

type Props = {
    appointmentId: string;
    // Fecha actual de la cita (ISO)
    currentDate: string;
    serviceName: string;
    // El cliente ve el aviso de que la barbería debe volver a confirmar
    needsConfirmation?: boolean;
    onClose: () => void;
    onDone: (updated: { date: string; status: string }) => void;
};

function toLocalKey(date: Date) {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
}

export default function RescheduleDialog({
    appointmentId,
    currentDate,
    serviceName,
    needsConfirmation = false,
    onClose,
    onDone,
}: Props) {
    const t = useTranslations("Reschedule");
    const [date, setDate] = useState(() => toLocalKey(new Date(currentDate)));
    const [slots, setSlots] = useState<Slot[]>([]);
    const [loadedDate, setLoadedDate] = useState<string | null>(null);
    const [selected, setSelected] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const loading = loadedDate !== date;

    useEffect(() => {
        if (!date) return;

        let ignore = false;

        fetch(`/api/protected/appointments/${appointmentId}/reschedule?date=${date}`)
            .then((res) => (res.ok ? res.json() : Promise.reject(new Error("load"))))
            .then((data: { slots: Slot[] }) => {
                if (ignore) return;
                setSlots(data.slots);
                setLoadedDate(date);
            })
            .catch(() => {
                if (ignore) return;
                setSlots([]);
                setLoadedDate(date);
                toast.error(t("errors.load"));
            });

        return () => {
            ignore = true;
        };
    }, [appointmentId, date, t]);

    const save = async () => {
        if (!selected) return;

        setSaving(true);

        try {
            const res = await fetch(`/api/protected/appointments/${appointmentId}/reschedule`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ date: selected }),
            });

            if (!res.ok) {
                toast.error(res.status === 409 ? t("errors.taken") : t("errors.failed"));
                return;
            }

            const updated = await res.json();
            toast.success(t("success"));
            onDone({ date: updated.date, status: updated.status });
        } catch {
            toast.error(t("errors.failed"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <BrandDialog
            title={t("title")}
            subtitle={t("subtitle", { service: serviceName })}
            closeLabel={t("close")}
            onClose={() => !saving && onClose()}
        >
            <label className="block font-semibold">
                {t("date")}
                <input
                    type="date"
                    value={date}
                    min={toLocalKey(new Date())}
                    onChange={(e) => {
                        setDate(e.target.value);
                        setSelected(null);
                    }}
                    className={brandInput}
                />
            </label>

            <p className="mt-6 font-semibold">{t("times")}</p>

            {loading ? (
                <p className="mt-2 text-[var(--brand-muted)]">{t("loading")}</p>
            ) : slots.length === 0 ? (
                <p className="mt-2 text-[var(--brand-muted)]">{t("empty")}</p>
            ) : (
                <div className="mt-3 grid max-h-64 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
                    {slots.map((slot) => (
                        <button
                            key={slot.start}
                            type="button"
                            aria-pressed={selected === slot.start}
                            onClick={() => setSelected(slot.start)}
                            className={`tabular min-h-12 border text-[length:var(--step-small)] font-semibold transition-colors ${
                                selected === slot.start
                                    ? "border-[var(--brand-ink)] bg-[var(--brand-ink)] text-[var(--brand-paper)]"
                                    : "border-[var(--brand-surface)] bg-[var(--brand-paper)] hover:border-[var(--brand-ink)]"
                            }`}
                        >
                            {slot.label}
                        </button>
                    ))}
                </div>
            )}

            {needsConfirmation && (
                <p className="mt-4 text-[length:var(--step-small)] text-[var(--brand-muted)]">{t("needsConfirmation")}</p>
            )}

            <button type="button" onClick={save} disabled={!selected || saving} className={`mt-6 ${brandPrimaryButton}`}>
                {saving ? t("saving") : t("confirm")}
            </button>
        </BrandDialog>
    );
}

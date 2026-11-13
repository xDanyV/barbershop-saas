"use client";

import { FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import BrandDialog, { brandInput, brandPrimaryButton } from "@/[locale]/components/BrandDialog";
import { normalizeMxPhone } from "@/lib/phone";

type Service = { id: string; name: string; duration: number };

type Props = {
    barberId: string;
    // Día seleccionado en la agenda (YYYY-MM-DD)
    initialDate: string;
    onClose: () => void;
    onCreated: () => void;
};

// Hora actual redondeada a los 5 minutos anteriores: lo normal es que el cliente acabe de llegar
function currentTime() {
    const now = new Date();
    const minutes = Math.floor(now.getMinutes() / 5) * 5;
    return `${String(now.getHours()).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export default function WalkInDialog({ barberId, initialDate, onClose, onCreated }: Props) {
    const t = useTranslations("WalkIn");
    const [services, setServices] = useState<Service[] | null>(null);
    const [form, setForm] = useState({ name: "", phone: "", serviceId: "", date: initialDate, time: currentTime() });
    const [saving, setSaving] = useState(false);
    // Avisos dentro de la ventana: un error de datos, o que la hora cae fuera del horario
    const [error, setError] = useState<string | null>(null);
    const [outside, setOutside] = useState<"dayOff" | "outsideHours" | "onBreak" | null>(null);

    useEffect(() => {
        let ignore = false;

        fetch(`/api/catalog?barberId=${barberId}`)
            .then((res) => (res.ok ? res.json() : Promise.reject(new Error("load"))))
            .then((data: Service[]) => {
                if (ignore) return;
                setServices(data);
                setForm((prev) => ({ ...prev, serviceId: data[0]?.id ?? "" }));
            })
            .catch(() => {
                if (!ignore) setServices([]);
            });

        return () => {
            ignore = true;
        };
    }, [barberId]);

    const update = (key: keyof typeof form, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setError(null);
        setOutside(null);
    };

    const save = async (allowOutsideHours: boolean) => {
        if (form.phone.trim() && !normalizeMxPhone(form.phone)) {
            setError(t("errors.phone"));
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const res = await fetch("/api/protected/appointments/manual", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, allowOutsideHours }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                const code: string = data?.code ?? "";

                if (res.status === 422 && code.startsWith("OUTSIDE_HOURS:")) {
                    setOutside(code.split(":")[1] as "dayOff" | "outsideHours" | "onBreak");
                    return;
                }

                setError(res.status === 409 ? t("errors.conflict") : t("errors.failed"));
                return;
            }

            toast.success(t("success", { name: form.name.trim() }));
            onCreated();
        } catch {
            setError(t("errors.failed"));
        } finally {
            setSaving(false);
        }
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        save(false);
    };

    return (
        <BrandDialog
            title={t("title")}
            subtitle={t("subtitle")}
            closeLabel={t("close")}
            onClose={() => !saving && onClose()}
        >
            {services !== null && services.length === 0 ? (
                <p className="text-[var(--brand-muted)]">{t("noServices")}</p>
            ) : (
                <form onSubmit={submit} className="space-y-5">
                    <label className="block font-semibold">
                        {t("name")}
                        <input
                            required
                            maxLength={100}
                            autoComplete="off"
                            value={form.name}
                            onChange={(e) => update("name", e.target.value)}
                            className={brandInput}
                        />
                    </label>

                    <label className="block font-semibold">
                        {t("phone")}
                        <input
                            type="tel"
                            inputMode="tel"
                            autoComplete="off"
                            value={form.phone}
                            onChange={(e) => update("phone", e.target.value)}
                            className={brandInput}
                        />
                    </label>

                    <label className="block font-semibold">
                        {t("service")}
                        <select
                            required
                            value={form.serviceId}
                            onChange={(e) => update("serviceId", e.target.value)}
                            className={brandInput}
                        >
                            {(services ?? []).map((service) => (
                                <option key={service.id} value={service.id}>
                                    {service.name} · {service.duration} min
                                </option>
                            ))}
                        </select>
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                        <label className="block min-w-0 font-semibold">
                            {t("date")}
                            <input
                                required
                                type="date"
                                value={form.date}
                                onChange={(e) => update("date", e.target.value)}
                                className={brandInput}
                            />
                        </label>

                        <label className="block min-w-0 font-semibold">
                            {t("time")}
                            <input
                                required
                                type="time"
                                step={300}
                                value={form.time}
                                onChange={(e) => update("time", e.target.value)}
                                className={brandInput}
                            />
                        </label>
                    </div>

                    {error && (
                        <p role="alert" className="border-l-4 border-[#b8431f] bg-[#fbeee9] px-4 py-3 text-[#7a2c14]">
                            {error}
                        </p>
                    )}

                    {outside ? (
                        <div role="alert" className="space-y-3 border-l-4 border-[#d4a017] bg-[#fbf4df] px-4 py-3">
                            <p className="font-semibold">{t(`outside.${outside}`)}</p>
                            <p className="text-[var(--brand-muted)]">{t("outside.question")}</p>
                            <div className="grid gap-2 sm:grid-cols-2">
                                <button type="button" onClick={() => save(true)} disabled={saving} className={brandPrimaryButton}>
                                    {saving ? t("saving") : t("outside.confirm")}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setOutside(null)}
                                    disabled={saving}
                                    className="inline-flex min-h-12 items-center justify-center border border-[var(--brand-ink)] px-4 font-semibold"
                                >
                                    {t("outside.change")}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button type="submit" disabled={saving || !form.serviceId} className={brandPrimaryButton}>
                            {saving ? t("saving") : t("save")}
                        </button>
                    )}
                </form>
            )}
        </BrandDialog>
    );
}

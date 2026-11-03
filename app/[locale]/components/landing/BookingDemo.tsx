"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useDemoState } from "./DemoState";

// Datos de ejemplo de una barbería de muestra (no es un negocio real)
const DAYS = ["today", "tomorrow", "thu"] as const;
const TIMES = ["10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM"];
const TAKEN: Record<(typeof DAYS)[number], string[]> = {
    today: ["10:00 AM", "12:00 PM", "4:00 PM"],
    tomorrow: ["11:00 AM", "5:00 PM"],
    thu: ["1:00 PM"],
};
const SERVICES = [
    { id: "cut", price: 150, minutes: 45 },
    { id: "beard", price: 100, minutes: 30 },
    { id: "both", price: 220, minutes: 60 },
] as const;
const AGENDA = [
    { time: "10:00 AM", client: "Carlos M.", service: "cut" },
    { time: "12:00 PM", client: "Andrés R.", service: "both" },
    { time: "4:00 PM", client: "Jorge L.", service: "beard" },
] as const;

type Day = (typeof DAYS)[number];
type ServiceId = (typeof SERVICES)[number]["id"];

// Ejemplo vivo de la página de reservas: el visitante elige día, hora y servicio y ve su cita confirmada
export default function BookingDemo() {
    const t = useTranslations("Landing.demo");
    const { mode, setMode } = useDemoState();
    const [day, setDay] = useState<Day>("today");
    const [time, setTime] = useState<string | null>(null);
    const [serviceId, setServiceId] = useState<ServiceId>("cut");

    const service = SERVICES.find((s) => s.id === serviceId)!;

    return (
        <div data-ui className="w-full max-w-[400px] rounded-2xl bg-[var(--brand-paper)] p-5 text-[var(--brand-ink)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-[1.0625rem] font-semibold leading-snug">{t("shop")}</p>
                    <p className="text-[length:var(--step-small)] text-[var(--brand-muted)]">{t("area")}</p>
                </div>
                <span className="shrink-0 rounded-full bg-[var(--brand-surface)] px-2.5 py-1 text-[length:var(--step-small)] text-[var(--brand-muted)]">
                    {t("label")}
                </span>
            </div>

            {mode === "setup" && (
                <div className="mt-6">
                    <p className="text-[length:var(--step-small)] font-semibold text-[var(--brand-muted)]">{t("setupTitle")}</p>
                    <ul className="mt-3 space-y-2">
                        {(["services", "hours", "rest", "team"] as const).map((key) => (
                            <li key={key} className="rounded-xl bg-[var(--brand-bg)] px-4 py-3 text-[0.9375rem]">
                                {t(`setupItems.${key}`)}
                            </li>
                        ))}
                    </ul>
                    <p className="mt-4 truncate text-[length:var(--step-small)] text-[var(--brand-muted)]">
                        /es/business/barberia-calle-segunda
                    </p>
                </div>
            )}

            {mode === "book" && (
                <div className="mt-6">
                    <p className="text-[length:var(--step-small)] font-semibold text-[var(--brand-muted)]">{t("chooseDay")}</p>
                    <div className="mt-2 grid grid-cols-3 gap-2" role="radiogroup" aria-label={t("chooseDay")}>
                        {DAYS.map((d) => (
                            <button
                                key={d}
                                type="button"
                                role="radio"
                                aria-checked={day === d}
                                onClick={() => {
                                    setDay(d);
                                    setTime(null);
                                }}
                                className={`min-h-11 rounded-xl px-2 text-[0.9375rem] transition-[background-color,transform] duration-150 active:scale-[0.97] ${day === d
                                    ? "bg-[var(--brand-ink)] text-[var(--brand-paper)]"
                                    : "bg-[var(--brand-bg)] hover:bg-[var(--brand-surface)]"
                                    }`}
                            >
                                {t(`days.${d}`)}
                            </button>
                        ))}
                    </div>

                    <p className="mt-5 text-[length:var(--step-small)] font-semibold text-[var(--brand-muted)]">{t("chooseTime")}</p>
                    <div className="mt-2 grid grid-cols-3 gap-2" role="radiogroup" aria-label={t("chooseTime")}>
                        {TIMES.map((slot) => {
                            const taken = TAKEN[day].includes(slot);
                            const selected = time === slot;

                            return (
                                <button
                                    key={slot}
                                    type="button"
                                    role="radio"
                                    aria-checked={selected}
                                    disabled={taken}
                                    onClick={() => setTime(slot)}
                                    className={`tabular min-h-11 rounded-xl px-1 text-[0.875rem] transition-[background-color,transform] duration-150 active:scale-[0.97] disabled:cursor-not-allowed ${selected
                                        ? "bg-[var(--brand-accent)] text-[var(--brand-ink)]"
                                        : taken
                                            ? "bg-[var(--brand-bg)] text-[var(--brand-muted)] line-through"
                                            : "bg-[var(--brand-bg)] hover:bg-[var(--brand-surface)]"
                                        }`}
                                >
                                    {taken ? <span className="sr-only">{t("taken")} </span> : null}
                                    {slot}
                                </button>
                            );
                        })}
                    </div>

                    <p className="mt-5 text-[length:var(--step-small)] font-semibold text-[var(--brand-muted)]">{t("chooseService")}</p>
                    <div className="mt-2 space-y-2" role="radiogroup" aria-label={t("chooseService")}>
                        {SERVICES.map((s) => (
                            <button
                                key={s.id}
                                type="button"
                                role="radio"
                                aria-checked={serviceId === s.id}
                                onClick={() => setServiceId(s.id)}
                                className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-4 text-left text-[0.9375rem] transition-colors duration-150 ${serviceId === s.id
                                    ? "bg-[var(--brand-surface)] font-semibold"
                                    : "bg-[var(--brand-bg)] hover:bg-[var(--brand-surface)]"
                                    }`}
                            >
                                <span>{t(`services.${s.id}`)}</span>
                                <span className="tabular shrink-0 text-[var(--brand-muted)]">
                                    ${s.price} · {t("minutes", { minutes: s.minutes })}
                                </span>
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        disabled={!time}
                        onClick={() => setMode("confirmed")}
                        className="mt-5 min-h-12 w-full bg-[var(--brand-ink)] px-5 font-semibold text-[var(--brand-paper)] transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.99] disabled:opacity-40"
                    >
                        {time ? `${t("confirm")} · ${time}` : t("pickFirst")}
                    </button>
                </div>
            )}

            {mode === "confirmed" && (
                <div className="mt-6">
                    <div className="rounded-xl bg-[var(--brand-sand)] p-5">
                        <p className="text-[length:var(--step-small)] font-semibold">{t("confirmedTitle")}</p>
                        <p className="tabular mt-2 text-[2rem] leading-none tracking-tight">{time ?? "11:00 AM"}</p>
                        <p className="mt-2 text-[0.9375rem]">
                            {t(`days.${day}`)} · {t("confirmedWith", { service: t(`services.${service.id}`) })}
                        </p>
                        <p className="tabular mt-1 text-[0.9375rem] text-[var(--brand-muted)]">
                            ${service.price} MXN · {t("minutes", { minutes: service.minutes })}
                        </p>
                    </div>

                    <div className="mt-5">
                        <div className="flex items-baseline justify-between gap-3">
                            <p className="text-[length:var(--step-small)] font-semibold">{t("ownerTitle")}</p>
                            <p className="text-[length:var(--step-small)] text-[var(--brand-muted)]">{t("ownerNote")}</p>
                        </div>
                        <ul className="mt-2 space-y-1.5">
                            {[...AGENDA, { time: time ?? "11:00 AM", client: t("you"), service: service.id, isNew: true }]
                                .sort((a, b) => toMinutes(a.time) - toMinutes(b.time))
                                .map((row) => (
                                    <li
                                        key={`${row.time}-${row.client}`}
                                        className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-[0.875rem] ${"isNew" in row
                                            ? "bg-[var(--brand-accent)] text-[var(--brand-ink)]"
                                            : "bg-[var(--brand-bg)]"
                                            }`}
                                    >
                                        <span className="tabular w-20 shrink-0">{row.time}</span>
                                        <span className="min-w-0 flex-1 truncate">{row.client}</span>
                                        <span className="shrink-0">{t(`services.${row.service}`)}</span>
                                    </li>
                                ))}
                        </ul>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setTime(null);
                            setMode("book");
                        }}
                        className="mt-5 min-h-11 w-full bg-[var(--brand-bg)] px-5 font-semibold transition-colors duration-150 hover:bg-[var(--brand-surface)]"
                    >
                        {t("again")}
                    </button>
                </div>
            )}
        </div>
    );
}

function toMinutes(label: string) {
    const [clock, period] = label.split(" ");
    const [h, m] = clock.split(":").map(Number);
    return ((h % 12) + (period === "PM" ? 12 : 0)) * 60 + m;
}

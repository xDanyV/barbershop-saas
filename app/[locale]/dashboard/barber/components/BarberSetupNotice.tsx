"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, Clock, Scissors } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { BARBER_SETUP_CHANGED, OPEN_BARBER_HOURS } from "../setup-events";

type Setup = { services: number; days: number };

async function fetchSetup(): Promise<Setup | null> {
    try {
        const [services, hours] = await Promise.all([
            fetch("/api/protected/catalog").then((res) => (res.ok ? res.json() : null)),
            fetch("/api/protected/availability").then((res) => (res.ok ? res.json() : null)),
        ]);

        return Array.isArray(services) && Array.isArray(hours) ? { services: services.length, days: hours.length } : null;
    } catch {
        // Sin datos no se muestra el aviso; la agenda sigue funcionando
        return null;
    }
}

const stepAction =
    "inline-flex min-h-11 items-center justify-center gap-2 bg-gray-900 px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90";

// Sin servicios o sin horario nadie puede reservar con el barbero: se lo decimos en cuanto entra
export default function BarberSetupNotice() {
    const t = useTranslations("BarberSetup");
    const locale = useLocale();
    const pathname = usePathname();
    const [setup, setSetup] = useState<Setup | null>(null);

    useEffect(() => {
        const refresh = () => {
            fetchSetup().then((next) => {
                if (next) setSetup(next);
            });
        };

        refresh();
        window.addEventListener(BARBER_SETUP_CHANGED, refresh);
        return () => window.removeEventListener(BARBER_SETUP_CHANGED, refresh);
    }, []);

    if (!setup || (setup.services > 0 && setup.days > 0)) return null;

    const catalogPath = `/${locale}/dashboard/barber/catalog`;
    const onAgenda = pathname === `/${locale}/dashboard/barber`;
    const steps = [
        {
            key: "services",
            done: setup.services > 0,
            icon: Scissors,
            action: pathname.startsWith(catalogPath) ? null : (
                <Link href={catalogPath} className={stepAction}>
                    {t("services.action")}
                </Link>
            ),
        },
        {
            key: "hours",
            done: setup.days > 0,
            icon: Clock,
            action: onAgenda ? (
                <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_BARBER_HOURS))} className={stepAction}>
                    {t("hours.action")}
                </button>
            ) : (
                <Link href={`/${locale}/dashboard/barber?horario=1`} className={stepAction}>
                    {t("hours.action")}
                </Link>
            ),
        },
    ] as const;

    return (
        <section aria-labelledby="barber-setup-title" className="mt-6 border-l-4 border-[#e8603a] bg-white p-5 md:p-6">
            <h2 id="barber-setup-title" className="text-lg font-semibold text-gray-900">
                {t("title")}
            </h2>
            <p className="mt-1 max-w-[65ch] text-gray-600">{t("text")}</p>

            <ol className="mt-4 grid gap-3 md:grid-cols-2">
                {steps.map(({ key, done, icon: Icon, action }, index) => (
                    <li key={key} className={`flex flex-col gap-3 border p-4 sm:flex-row sm:items-center ${done ? "border-emerald-200 bg-emerald-50" : "border-gray-200"}`}>
                        <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center ${done ? "bg-emerald-600 text-white" : "bg-[#f1f3f2] text-gray-900"}`}
                            aria-hidden="true"
                        >
                            {done ? <Check size={20} /> : <Icon size={20} />}
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900">
                                {index + 1}. {t(`${key}.title`)}
                                {done && <span className="sr-only"> — {t("done")}</span>}
                            </p>
                            <p className="text-sm text-gray-600">{done ? t("done") : t(`${key}.text`)}</p>
                        </div>
                        {!done && action}
                    </li>
                ))}
            </ol>
        </section>
    );
}

"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { DayHours } from "@/lib/business-hours";
import { dayOfWeekFromKey, formatMinutes12h, minutesOfDay, resolveTimezone, timeToMinutes, toDateKey } from "@/lib/time/zoned";

type Props = {
    hours: DayHours[];
    timezone: string | null;
};

type State = { open: boolean; label: string } | null;

// "Abierto ahora" se calcula en el navegador: la página se guarda en caché y la hora del servidor quedaría vieja
export default function OpenNow({ hours, timezone }: Props) {
    const t = useTranslations("BusinessPage.hero");
    const [state, setState] = useState<State>(null);

    useEffect(() => {
        const update = () => {
            const tz = resolveTimezone(timezone);
            const now = new Date();
            const todayKey = toDateKey(now, tz);
            const today = hours.find((day) => day.dayOfWeek === dayOfWeekFromKey(todayKey));
            const minutes = minutesOfDay(now, tz);

            if (today?.open && today.close) {
                const open = timeToMinutes(today.open);
                const close = timeToMinutes(today.close);

                if (minutes >= open && minutes < close) {
                    return setState({ open: true, label: t("openUntil", { time: formatMinutes12h(close) }) });
                }

                if (minutes < open) {
                    return setState({ open: false, label: t("opensToday", { time: formatMinutes12h(open) }) });
                }
            }

            setState({ open: false, label: t("closedNow") });
        };

        update();
        const timer = window.setInterval(update, 60_000);

        return () => window.clearInterval(timer);
    }, [hours, timezone, t]);

    if (!state) return <p className="mt-5 min-h-6" aria-hidden="true" />;

    return (
        <p className="mt-5 flex min-h-6 items-center gap-2 font-semibold">
            <span className={`h-2.5 w-2.5 shrink-0 ${state.open ? "bg-[#2f7d5b]" : "bg-[var(--brand-accent)]"}`} aria-hidden="true" />
            {state.label}
        </p>
    );
}

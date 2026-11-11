import { getLocale, getTranslations } from "next-intl/server";
import type { DayHours } from "@/lib/business-hours";
import { dayOfWeekFromKey, formatMinutes12h, resolveTimezone, timeToMinutes, toDateKey } from "@/lib/time/zoned";

type Props = {
    hours: DayHours[];
    timezone: string | null;
};

const formatTime = (time: string) => formatMinutes12h(timeToMinutes(time));

// Horario de la semana sobre fondo oscuro (sección "Visítanos")
export default async function BusinessHours({ hours, timezone }: Props) {
    const t = await getTranslations("BusinessPage.hours");
    const locale = await getLocale();

    const today = dayOfWeekFromKey(toDateKey(new Date(), resolveTimezone(timezone)));
    const weekday = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-MX", { weekday: "long", timeZone: "UTC" });
    // 7 de enero de 2024 fue domingo: de ahí se saca el nombre de cada día
    const dayName = (dayOfWeek: number) => weekday.format(new Date(Date.UTC(2024, 0, 7 + dayOfWeek)));

    return (
        <div>
            <h3 className="text-[length:var(--step-lead)] font-semibold">{t("title")}</h3>

            <dl className="mt-3 divide-y divide-white/15">
                {hours.map((day) => {
                    const isToday = day.dayOfWeek === today;

                    return (
                        <div key={day.dayOfWeek} className="flex items-baseline justify-between gap-4 py-2.5">
                            <dt className={`first-letter:uppercase ${isToday ? "font-semibold" : "text-[var(--brand-field-muted)]"}`}>
                                {dayName(day.dayOfWeek)}
                                {isToday && <span className="ml-2 text-[length:var(--step-small)] font-semibold">{t("today")}</span>}
                            </dt>
                            <dd className={`tabular whitespace-nowrap ${isToday ? "font-semibold" : "text-[var(--brand-field-muted)]"}`}>
                                {day.open && day.close ? `${formatTime(day.open)} – ${formatTime(day.close)}` : t("closed")}
                            </dd>
                        </div>
                    );
                })}
            </dl>
        </div>
    );
}

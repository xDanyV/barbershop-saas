import { getLocale, getTranslations } from "next-intl/server";
import { brandFontClasses } from "@/[locale]/brand";
import { computeBusinessHours, type HoursRow } from "@/lib/business-hours";
import { dayOfWeekFromKey, formatMinutes12h, resolveTimezone, timeToMinutes, toDateKey } from "@/lib/time/zoned";

type Props = {
    rows: HoursRow[];
    timezone: string | null;
};

const formatTime = (time: string) => formatMinutes12h(timeToMinutes(time));

export default async function BusinessHours({ rows, timezone }: Props) {
    const t = await getTranslations("BusinessPage.hours");
    const locale = await getLocale();
    const hours = computeBusinessHours(rows);

    // Sin horarios configurados no se promete nada
    if (hours.every((day) => !day.open)) return null;

    const today = dayOfWeekFromKey(toDateKey(new Date(), resolveTimezone(timezone)));
    const weekday = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-MX", { weekday: "long", timeZone: "UTC" });
    // 7 de enero de 2024 fue domingo: de ahí se saca el nombre de cada día
    const dayName = (dayOfWeek: number) => weekday.format(new Date(Date.UTC(2024, 0, 7 + dayOfWeek)));

    return (
        <section className={`${brandFontClasses} bg-[#0f2733] p-5 text-[#f1f3f2] md:p-6`} style={{ fontFamily: "var(--font-brand), system-ui, sans-serif" }}>
            <h2 className="text-2xl font-semibold tracking-tight">{t("title")}</h2>

            <dl className="mt-4 divide-y divide-white/10">
                {hours.map((day) => {
                    const isToday = day.dayOfWeek === today;

                    return (
                        <div key={day.dayOfWeek} className="flex items-baseline justify-between gap-4 py-2.5">
                            <dt className={`first-letter:uppercase ${isToday ? "font-semibold" : "text-[#a9b7bc]"}`}>
                                {dayName(day.dayOfWeek)}
                                {isToday && <span className="ml-2 text-sm font-semibold text-[#e8603a]">{t("today")}</span>}
                            </dt>
                            <dd className={`whitespace-nowrap tabular-nums ${isToday ? "font-semibold" : "text-[#a9b7bc]"}`}>
                                {day.open && day.close ? `${formatTime(day.open)} – ${formatTime(day.close)}` : t("closed")}
                            </dd>
                        </div>
                    );
                })}
            </dl>
        </section>
    );
}

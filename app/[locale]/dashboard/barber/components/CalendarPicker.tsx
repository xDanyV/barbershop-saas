"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

type Exception = {
  startDate: string;
  endDate: string;
};

type Props = {
  selectedDate: string;
  onChange: (date: string) => void;
  // Avisa qué mes se está viendo, para cargar solo sus citas
  onMonthChange?: (year: number, month: number) => void;
  appointmentCounts?: Record<string, number>;
  exceptions?: Exception[];
  workingDays?: number[]; // 0=Sun,1=Mon,...6=Sat — days the barber works
};

const MONTH_KEYS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
] as const;

const DAY_KEYS = ["su", "mo", "tu", "we", "th", "fr", "sa"] as const;

export default function CalendarPicker({
  selectedDate,
  onChange,
  onMonthChange,
  appointmentCounts = {},
  exceptions = [],
  workingDays,
}: Props) {
  const t = useTranslations("CalendarPicker");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const { year, month } = view;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const moveMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setView({ year: next.getFullYear(), month: next.getMonth() });
    onMonthChange?.(next.getFullYear(), next.getMonth());
  };

  const isException = (dateString: string) => {
    return exceptions.some((e) => dateString >= e.startDate.split("T")[0] && dateString <= e.endDate.split("T")[0]);
  };

  const getTooltip = (exception: boolean, nonWorking: boolean, count: number) => {
    if (exception) return t("tooltip.blocked");
    if (nonWorking) return t("tooltip.nonWorking");
    if (count === 1) return t("tooltip.oneAppointment", { count });
    if (count > 1) return t("tooltip.manyAppointments", { count });
    return undefined;
  };

  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const date = new Date(year, month, day);
    const isSelected = selectedDate === dateString;
    const isToday = date.getTime() === today.getTime();
    const isPast = date < today;
    const count = appointmentCounts[dateString] || 0;
    const exception = isException(dateString);
    const nonWorking = Boolean(workingDays?.length) && !workingDays?.includes(date.getDay());
    const tooltip = getTooltip(exception, nonWorking, count);

    let tone = "text-gray-900 hover:bg-gray-100";
    if (isSelected) tone = "bg-gray-900 font-semibold text-white";
    else if (exception) tone = "bg-amber-50 text-amber-700";
    else if (nonWorking || isPast) tone = "text-gray-400 hover:bg-gray-100";

    days.push(
      <button
        key={day}
        type="button"
        onClick={() => onChange(dateString)}
        title={tooltip}
        aria-label={tooltip ? `${day}. ${tooltip}` : String(day)}
        aria-pressed={isSelected}
        aria-current={isToday ? "date" : undefined}
        className={`relative flex h-11 w-full flex-col items-center justify-center text-sm transition-colors ${tone} ${isToday && !isSelected ? "font-semibold ring-2 ring-inset ring-red-400" : ""}`}
      >
        <span className="leading-none">{day}</span>

        {count > 0 && (
          <span aria-hidden="true" className="absolute bottom-1 flex gap-0.5">
            {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
              <span key={i} className={`h-1 w-1 rounded-full ${isSelected ? "bg-white" : "bg-gray-900"}`} />
            ))}
          </span>
        )}
      </button>
    );
  }

  const navButton = "flex h-11 w-11 items-center justify-center text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900";

  return (
    <div className="w-full bg-white p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <button type="button" onClick={() => moveMonth(-1)} aria-label={t("previousMonth")} className={navButton}>
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <h2 className="font-semibold">
          {t(`monthNames.${MONTH_KEYS[month]}`)} {year}
        </h2>
        <button type="button" onClick={() => moveMonth(1)} aria-label={t("nextMonth")} className={navButton}>
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {DAY_KEYS.map((d) => (
          <div key={d} className="py-1 text-xs font-semibold text-gray-500">
            {t(`daysOfWeek.${d}`)}
          </div>
        ))}
        {days}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-gray-100 pt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-1 w-1 rounded-full bg-gray-900" />
          {t("legend.busy")}
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 w-3 bg-amber-100" />
          {t("legend.blocked")}
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 w-3 ring-2 ring-inset ring-red-400" />
          {t("legend.today")}
        </span>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type Exception = {
  startDate: string;
  endDate: string;
};

type Props = {
  selectedDate: string;
  onChange: (date: string) => void;
  appointmentCounts?: Record<string, number>;
  exceptions?: Exception[];
  workingDays?: number[]; // 0=Sun,1=Mon,...6=Sat — days the barber works
};

function densityStyle(n: number): string {
  if (n <= 0) return "text-gray-600 hover:bg-indigo-50 hover:text-indigo-700";
  if (n <= 2) return "bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100";
  if (n <= 4) return "bg-green-50 border border-green-200 text-green-800 hover:bg-green-100";
  if (n <= 7) return "bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100";
  return "bg-red-50 border border-red-200 text-red-800 hover:bg-red-100";
}

function dotColor(n: number, isPast: boolean): string {
  if (isPast) return "bg-gray-400";
  if (n <= 2) return "bg-blue-400";
  if (n <= 4) return "bg-green-500";
  if (n <= 7) return "bg-amber-500";
  return "bg-red-500";
}

const MONTH_KEYS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
] as const;

const DAY_KEYS = ["su", "mo", "tu", "we", "th", "fr", "sa"] as const;

export default function CalendarPicker({
  selectedDate,
  onChange,
  appointmentCounts = {},
  exceptions = [],
  workingDays,
}: Props) {
  const t = useTranslations("CalendarPicker");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };

  const isException = (dateString: string): boolean => {
    const [dy, dm, dd] = dateString.split("-").map(Number);
    const date = new Date(dy, dm - 1, dd, 12, 0, 0, 0); 

    return exceptions.some((e) => {
      const [sy, sm, sd] = e.startDate.split("T")[0].split("-").map(Number);
      const [ey, em, ed] = e.endDate.split("T")[0].split("-").map(Number);
      const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
      const end   = new Date(ey, em - 1, ed, 23, 59, 59, 999);
      return date >= start && date <= end;
    });
  };

  const isPastDate = (dateString: string): boolean => {
    const [dy, dm, dd] = dateString.split("-").map(Number);
    const d = new Date(dy, dm - 1, dd, 0, 0, 0, 0);
    return d < today;
  };

  const isNonWorkingDay = (dateString: string): boolean => {
    if (!workingDays || workingDays.length === 0) return false;
    const [dy, dm, dd] = dateString.split("-").map(Number);
    const dayOfWeek = new Date(dy, dm - 1, dd).getDay();
    return !workingDays.includes(dayOfWeek);
  };

  const getTooltip = (exception: boolean, nonWorking: boolean, count: number): string | undefined => {
    if (exception) return t("tooltip.blocked");
    if (nonWorking) return t("tooltip.nonWorking");
    if (count === 1) return t("tooltip.oneAppointment", { count });
    if (count > 1) return t("tooltip.manyAppointments", { count });
    return undefined;
  };

  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={"empty" + i} />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const isSelected = selectedDate === dateString;
    const isToday =
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear();
    const count = appointmentCounts[dateString] || 0;
    const dotCount = Math.min(count, 3);
    const exception = isException(dateString);
    const isPast = isPastDate(dateString);
    const nonWorking = isNonWorkingDay(dateString);

    days.push(
      <button
        key={day}
        onClick={() => onChange(dateString)}
        title={getTooltip(exception, nonWorking, count)}
        className={`
          h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl text-xs sm:text-sm flex flex-col items-center justify-center
          transition-all duration-200 relative mx-auto
          ${isSelected
            ? "bg-indigo-600 text-white shadow-md z-10"
            : exception
              ? "bg-purple-50 border border-purple-200 text-purple-400 cursor-default"
              : nonWorking
                ? "text-gray-300 cursor-default"
                : isPast
                  ? "bg-gray-100 border border-gray-200 text-gray-400 hover:bg-gray-200"
                  : densityStyle(count)
          }
          ${isToday && !isSelected ? "ring-2 ring-indigo-400 ring-offset-1" : ""}
        `}
      >
        <span className={`leading-none ${isToday ? "font-bold" : ""}`}>
          {day}
        </span>

        {exception && !isSelected && (
          <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-purple-400 mt-0.5" />
        )}

        {count > 0 && !isSelected && !exception && !nonWorking && (
          <div className="flex gap-0.5 mt-0.5">
            {Array.from({ length: dotCount }).map((_, i) => (
              <span
                key={i}
                className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${dotColor(count, isPast)} ${i === dotCount - 1 && count > 3 ? "opacity-50" : ""}`}
              />
            ))}
          </div>
        )}
      </button>
    );
  }

  return (
    <div className="w-full max-w-md bg-white border border-gray-100 rounded-3xl sm:rounded-4xl p-4 sm:p-7 shadow-xl shadow-gray-100/50">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
        <h3 className="font-bold text-gray-800 text-lg">{t("title")}</h3>
        <div className="flex items-center justify-between w-full sm:w-auto gap-2 bg-gray-50 p-1 rounded-xl">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm transition text-gray-400 hover:text-indigo-600">←</button>
          <span className="text-xs sm:text-sm font-bold text-gray-700 px-2 min-w-25 text-center">
            {t(`monthNames.${MONTH_KEYS[currentMonth]}`)} {currentYear}
          </span>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm transition text-gray-400 hover:text-indigo-600">→</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-2 sm:gap-y-4 gap-x-1 sm:gap-x-2 text-center">
        {DAY_KEYS.map((d) => (
          <div key={d} className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-300 py-2">
            {t(`daysOfWeek.${d}`)}
          </div>
        ))}
        {days}
      </div>

      <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-50 flex flex-wrap justify-between items-center gap-3 text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-600" /> {t("legend.selected")}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-purple-400" /> {t("legend.blocked")}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" /> {t("legend.busy")}
        </div>
        {workingDays && workingDays.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-200" /> {t("legend.nonWorking")}
          </div>
        )}
      </div>
    </div>
  );
}
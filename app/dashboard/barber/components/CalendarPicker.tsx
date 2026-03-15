"use client";

import { useState } from "react";

type Props = {
  selectedDate: string;
  onChange: (date: string) => void;
  appointmentCounts?: Record<string, number>; // "YYYY-MM-DD" -> cantidad de citas
};

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function densityStyle(n: number): string {
  if (n <= 0) return "text-gray-600 hover:bg-indigo-50 hover:text-indigo-700";
  if (n <= 2) return "bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100";
  if (n <= 4) return "bg-green-50 border border-green-200 text-green-800 hover:bg-green-100";
  if (n <= 7) return "bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100";
  return "bg-red-50 border border-red-200 text-red-800 hover:bg-red-100";
}

function dotColor(n: number): string {
  if (n <= 2) return "bg-blue-400";
  if (n <= 4) return "bg-green-500";
  if (n <= 7) return "bg-amber-500";
  return "bg-red-500";
}

export default function CalendarPicker({
  selectedDate,
  onChange,
  appointmentCounts = {},
}: Props) {
  const today = new Date();
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

    days.push(
      <button
        key={day}
        onClick={() => onChange(dateString)}
        title={count > 0 ? `${count} appointment${count > 1 ? "s" : ""}` : undefined}
        className={`
          h-10 w-10 rounded-lg text-sm flex flex-col items-center justify-center
          transition-all duration-150 relative
          ${isSelected
            ? "bg-indigo-600 text-white shadow-md"
            : densityStyle(count)
          }
          ${isToday && !isSelected ? "ring-1 ring-indigo-400 ring-offset-1" : ""}
        `}
      >
        <span className={`leading-none ${isToday ? "font-semibold" : ""}`}>
          {day}
        </span>

        {/* Dots indicadores — ocultos cuando está seleccionado */}
        {count > 0 && !isSelected && (
          <div className="flex gap-0.5 mt-0.5">
            {Array.from({ length: dotCount }).map((_, i) => (
              <span
                key={i}
                className={`w-1 h-1 rounded-full ${dotColor(count)} ${i === dotCount - 1 && count > 3 ? "opacity-50" : ""}`}
              />
            ))}
          </div>
        )}
      </button>
    );
  }

  return (
    <div className="w-85 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 transition"
        >
          ←
        </button>

        <div className="flex gap-2">
          <select
            value={currentMonth}
            onChange={(e) => setCurrentMonth(Number(e.target.value))}
            className="text-sm border border-gray-200 rounded-md px-2 py-1 bg-white"
          >
            {monthNames.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>

          <select
            value={currentYear}
            onChange={(e) => setCurrentYear(Number(e.target.value))}
            className="text-sm border border-gray-200 rounded-md px-2 py-1 bg-white"
          >
            {Array.from({ length: 10 }).map((_, i) => {
              const year = currentYear - 5 + i;
              return <option key={year} value={year}>{year}</option>;
            })}
          </select>
        </div>

        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 transition"
        >
          →
        </button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 text-xs text-gray-400 mb-3">
        {daysOfWeek.map((d) => (
          <div key={d} className="text-center font-medium">{d}</div>
        ))}
      </div>

      {/* Grid de días */}
      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100 flex-wrap">
        <span className="text-xs text-gray-400 mr-1">Appointments:</span>
        {[
          { label: "1–2", bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-400" },
          { label: "3–4", bg: "bg-green-50", border: "border-green-200", dot: "bg-green-500" },
          { label: "5–7", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500" },
          { label: "8+", bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500" },
        ].map(({ label, bg, border, dot }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-sm border ${bg} ${border}`} />
            <span className="text-xs text-gray-500">{label}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
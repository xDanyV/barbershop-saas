"use client";

import { useState } from "react";

type Exception = {
  startDate: string;
  endDate: string;
};

type Props = {
  selectedDate: string;
  onChange: (date: string) => void;
  appointmentCounts?: Record<string, number>;
  exceptions?: Exception[];
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

function dotColor(n: number, isPast: boolean): string {
  if (isPast) return "bg-gray-400";
  if (n <= 2) return "bg-blue-400";
  if (n <= 4) return "bg-green-500";
  if (n <= 7) return "bg-amber-500";
  return "bg-red-500";
}

export default function CalendarPicker({
  selectedDate,
  onChange,
  appointmentCounts = {},
  exceptions = [],
}: Props) {
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
    const date = new Date(dateString);
    return exceptions.some((e) => {
      const start = new Date(e.startDate);
      const end = new Date(e.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
    });
  };

  const isPastDate = (dateString: string): boolean => {
    const d = new Date(dateString);
    d.setHours(0, 0, 0, 0);
    return d < today;
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

    days.push(
      <button
        key={day}
        onClick={() => onChange(dateString)}
        title={
          exception
            ? "Exception — day blocked"
            : count > 0
              ? `${count} appointment${count > 1 ? "s" : ""}`
              : undefined
        }
        className={`
          h-10 w-10 rounded-xl text-sm flex flex-col items-center justify-center
          transition-all duration-200 relative
          ${isSelected
            ? "bg-indigo-600 text-white shadow-md"
            : exception
              ? "bg-purple-50 border border-purple-200 text-purple-400"
              : isPast
                ? "bg-gray-100 border border-gray-200 text-gray-400 hover:bg-gray-200"
                : densityStyle(count)
          }
          ${isToday && !isSelected ? "ring-2 ring-indigo-400 ring-offset-1" : ""}
        `}
      >
        <span className={`leading-none ${isToday ? "font-semibold" : ""}`}>
          {day}
        </span>

        {exception && !isSelected && (
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-0.5" />
        )}

        {count > 0 && !isSelected && !exception && (
          <div className="flex gap-0.5 mt-0.5">
            {Array.from({ length: dotCount }).map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${dotColor(count, isPast)} ${i === dotCount - 1 && count > 3 ? "opacity-50" : ""}`}
              />
            ))}
          </div>
        )}
      </button>
    );
  }

  return (
    <div className="w-full max-w-md bg-white border border-gray-100 rounded-4xl p-7 shadow-xl shadow-gray-100/50">
      <div className="flex items-center justify-between mb-8">
        <h3 className="font-bold text-gray-800 text-lg">Schedule</h3>
        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm transition text-gray-400 hover:text-indigo-600">←</button>
          <span className="text-sm font-bold text-gray-700 px-2">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm transition text-gray-400 hover:text-indigo-600">→</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-4 gap-x-2 text-center">
        {daysOfWeek.map((d) => (
          <div key={d} className="text-[10px] font-black uppercase tracking-widest text-gray-300">{d}</div>
        ))}
        {days}
      </div>


      <div className="mt-8 pt-6 border-t border-gray-50 flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-600" /> Selected
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-purple-400" /> Blocked
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" /> Busy
        </div>
      </div>
    </div>
  );
}

"use client";

import Calendar from "react-calendar";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Info } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

type Exception = {
  startDate: string;
  endDate: string;
};

type Props = {
  barberId: string;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
};

export default function CalendarPicker({ selectedDate, setSelectedDate, barberId }: Props) {
  const t = useTranslations("CalendarPickerCustomer");
  const locale = useLocale();

  const [availability, setAvailability] = useState<number[]>([]);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [availRes, excRes] = await Promise.all([
          fetch(`/api/availability/${barberId}`),
          fetch(`/api/exceptions/${barberId}`),
        ]);

        let availDays: number[] = [];
        let excList: Exception[] = [];

        if (availRes.ok) {
          const availData = await availRes.json();
          availDays = availData.map((d: any) => d.dayOfWeek);
          setAvailability(availDays);
        }
        if (excRes.ok) {
          excList = await excRes.json();
          setExceptions(excList);
        }

        // Auto-select the first available day once we have the schedule.
        // Start from tomorrow to avoid selecting today (slots may be gone).
        const firstAvailable = findFirstAvailableDay(availDays, excList);
        if (firstAvailable) {
          setSelectedDate(firstAvailable);
        }

        setReady(true);
      } catch (error) {
        console.error("Failed to load calendar data", error);
        setReady(true);
      }
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barberId]);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /** Returns true if the given date falls within any exception range. */
  const isException = (date: Date): boolean => {
    return exceptions.some((e) => {
      const [sy, sm, sd] = e.startDate.split("T")[0].split("-").map(Number);
      const [ey, em, ed] = e.endDate.split("T")[0].split("-").map(Number);

      const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
      const end = new Date(ey, em - 1, ed, 23, 59, 59, 999);

      // Use noon to avoid DST edge cases
      const check = new Date(date);
      check.setHours(12, 0, 0, 0);

      return check >= start && check <= end;
    });
  };

  /** Returns true if the date is today or in the past. */
  const isPastDate = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    // Strictly less than today — today itself is allowed.
    // Past slots within today are filtered in AvailableSlots by time comparison.
    return d < today;
  };

  /** Returns true if the date is fully disabled (not selectable). */
  const isDisabled = (date: Date): boolean => {
    return (
      isPastDate(date) ||
      !availability.includes(date.getDay()) ||
      isException(date)
    );
  };

  /**
   * Walks forward from today up to 60 days to find the first day that:
   * - is a working day for the barber
   * - is not blocked by an exception
   */
  function findFirstAvailableDay(
    availDays: number[],
    excList: Exception[]
  ): Date | null {
    const candidate = new Date();
    candidate.setHours(0, 0, 0, 0);
    // Start from today — remaining slots for today are shown if any exist.
    // AvailableSlots filters out past hours within the day.

    for (let i = 0; i < 60; i++) {
      const dayOfWeek = candidate.getDay();
      const isWorking = availDays.includes(dayOfWeek);
      const isBlocked = excList.some((e) => {
        const [sy, sm, sd] = e.startDate.split("T")[0].split("-").map(Number);
        const [ey, em, ed] = e.endDate.split("T")[0].split("-").map(Number);
        const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
        const end = new Date(ey, em - 1, ed, 23, 59, 59, 999);
        const check = new Date(candidate);
        check.setHours(12, 0, 0, 0);
        return check >= start && check <= end;
      });

      if (isWorking && !isBlocked) {
        return new Date(candidate);
      }

      candidate.setDate(candidate.getDate() + 1);
    }

    return null; // no availability in the next 60 days
  }

  // ─── Tile class ─────────────────────────────────────────────────────────────

  /**
   * Returns a CSS class for each calendar tile:
   * - "exception-day"    → purple, blocked by barber exception
   * - "unavailable-day"  → gray, not a working day or past
   * - "calendar-tile"    → default available style
   */
  const getTileClass = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return null;
    // Check exception FIRST — before isPastOrToday — so future exceptions
    // get their purple style instead of falling into "unavailable-day".
    if (isException(date)) return "exception-day";
    if (isPastDate(date)) return "unavailable-day";
    if (!availability.includes(date.getDay())) return "unavailable-day";
    return "calendar-tile";
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (!ready) {
    return (
      <div className="w-full flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full overflow-hidden"
    >
      <div className="calendar-container w-full">
        <Calendar
          value={selectedDate}
          onChange={(value) => {
            const picked = value as Date;
            // Extra guard: ignore clicks on disabled tiles
            if (!isDisabled(picked)) {
              setSelectedDate(picked);
            }
          }}
          locale={locale}
          className="w-ful! border-none! font-sans!"
          tileDisabled={({ date, view }) => {
            if (view !== "month") return false;
            // Exception days are visually distinct but NOT marked as :disabled —
            // react-calendar's disabled class would override our exception-day styles.
            // Clicks on exception days are blocked in onChange instead.
            return isPastDate(date) || !availability.includes(date.getDay());
          }}
          tileClassName={getTileClass}
        />
      </div>

      {/* Legend */}
      <div className="mt-4 md:mt-6 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-y-3 gap-x-4 px-2 md:px-4 py-3 border-t border-gray-50">
        <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400">
          <div className="w-2 h-2 rounded-full bg-indigo-600" />
          <span>{t("legend.selected")}</span>
        </div>
        <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <span>{t("legend.today")}</span>
        </div>
        <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400">
          <div className="w-2 h-2 rounded-full bg-gray-200" />
          <span>{t("legend.unavailable")}</span>
        </div>
        {/* New: exception legend item */}
        <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400">
          <div className="w-2 h-2 rounded-full bg-purple-400" />
          <span>{t("legend.exception")}</span>
        </div>

        <div className="flex items-center gap-1.5 col-span-2 sm:ml-auto text-indigo-400 pt-1 sm:pt-0">
          <Info size={14} className="shrink-0" />
          <span className="text-[9px] md:text-[10px] lowercase font-bold tracking-normal italic">
            {t("hint")}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
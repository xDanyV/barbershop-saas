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
  }, [barberId]);

  const isException = (date: Date): boolean => {
    return exceptions.some((e) => {
      const [sy, sm, sd] = e.startDate.split("T")[0].split("-").map(Number);
      const [ey, em, ed] = e.endDate.split("T")[0].split("-").map(Number);

      const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
      const end = new Date(ey, em - 1, ed, 23, 59, 59, 999);

      const check = new Date(date);
      check.setHours(12, 0, 0, 0);

      return check >= start && check <= end;
    });
  };

  const isPastOrToday = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d <= today;
  };

  const isDisabled = (date: Date): boolean => {
    return (
      isPastOrToday(date) ||
      !availability.includes(date.getDay()) ||
      isException(date)
    );
  };

  function findFirstAvailableDay(
    availDays: number[],
    excList: Exception[]
  ): Date | null {
    const candidate = new Date();
    candidate.setHours(0, 0, 0, 0);
    candidate.setDate(candidate.getDate() + 1); 

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

    return null;
  }

  const getTileClass = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return null;
    if (isPastOrToday(date)) return "unavailable-day";
    if (isException(date)) return "exception-day";
    if (!availability.includes(date.getDay())) return "unavailable-day";
    return "calendar-tile";
  };

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
            if (!isDisabled(picked)) {
              setSelectedDate(picked);
            }
          }}
          locale={locale}
          className="w-ful! border-none! font-sans!"
          tileDisabled={({ date, view }) =>
            view === "month" ? isDisabled(date) : false
          }
          tileClassName={getTileClass}
        />
      </div>

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
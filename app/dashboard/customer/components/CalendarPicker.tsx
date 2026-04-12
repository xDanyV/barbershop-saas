"use client";

import Calendar from "react-calendar";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Info } from "lucide-react";

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
  const [availability, setAvailability] = useState<number[]>([]);
  const [exceptions, setExceptions] = useState<Exception[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [availRes, excRes] = await Promise.all([
          fetch(`/api/availability/${barberId}`),
          fetch(`/api/exceptions/${barberId}`)
        ]);

        if (availRes.ok) {
          const availData = await availRes.json();
          setAvailability(availData.map((d: any) => d.dayOfWeek));
        }
        if (excRes.ok) {
          const excData = await excRes.json();
          setExceptions(excData);
        }
      } catch (error) {
        console.error("Failed to load calendar data", error);
      }
    }
    fetchData();
  }, [barberId]);

  const isException = (date: Date): boolean => {
    return exceptions.some((e) => {
      // Parse date-only strings directly to avoid UTC offset issues
      const [sy, sm, sd] = e.startDate.split("T")[0].split("-").map(Number);
      const [ey, em, ed] = e.endDate.split("T")[0].split("-").map(Number);

      const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
      const end = new Date(ey, em - 1, ed, 23, 59, 59, 999);

      const check = new Date(date);
      check.setHours(12, 0, 0, 0); // noon to avoid any DST edge cases

      return check >= start && check <= end;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <Calendar
        value={selectedDate}
        onChange={(value) => setSelectedDate(value as Date)}
        locale="en-US"
        tileDisabled={({ date, view }) => {
          if (view !== "month") return false;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return (
            date < today ||
            !availability.includes(date.getDay()) ||
            isException(date)
          );
        }}
        tileClassName={({ date, view }) => {
          if (view !== "month") return null;
          if (isException(date)) return "exception-day";
          return null;
        }}
      />

      {/* Leyenda de ayuda en la parte inferior */}
      <div className="mt-6 flex flex-wrap gap-4 px-4 py-3">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
          <div className="w-2 h-2 rounded-full bg-indigo-600" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
          <div className="w-2 h-2 rounded-full bg-gray-200" />
          <span>Unavailable</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto text-indigo-400">
          <Info size={14} />
          <span className="text-[10px] lowercase font-bold tracking-normal italic">
            choose an active day to see slots
          </span>
        </div>
      </div>
    </motion.div>
  );
}
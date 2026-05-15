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
      className="relative w-full overflow-hidden"
    >
      {/* Contenedor con estilos inyectados para forzar responsividad */}
      <div className="calendar-container w-full">
        <Calendar
          value={selectedDate}
          onChange={(value) => setSelectedDate(value as Date)}
          locale="en-US"
          className="w-ful! border-none! font-sans!" // Forzamos ancho completo y quitamos bordes nativos
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
            return "calendar-tile"; // Clase personalizada para estilizar
          }}
        />
      </div>

      {/* Leyenda de ayuda - Ajustada con flex-col en móviles muy pequeños */}
      <div className="mt-4 md:mt-6 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-y-3 gap-x-4 px-2 md:px-4 py-3 border-t border-gray-50">
        <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400">
          <div className="w-2 h-2 rounded-full bg-indigo-600" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400">
          <div className="w-2 h-2 rounded-full bg-gray-200" />
          <span>Unavailable</span>
        </div>

        {/* Info tool-tip: Se mueve a su propia línea en móvil si no hay espacio */}
        <div className="flex items-center gap-1.5 col-span-2 sm:ml-auto text-indigo-400 pt-1 sm:pt-0">
          <Info size={14} className="shrink-0" />
          <span className="text-[9px] md:text-[10px] lowercase font-bold tracking-normal italic">
            choose an active day to see slots
          </span>
        </div>
      </div>
    </motion.div>
  );
}
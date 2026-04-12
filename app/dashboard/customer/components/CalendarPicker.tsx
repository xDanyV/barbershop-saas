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
      const start = new Date(e.startDate);
      const end = new Date(e.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <style jsx global>{`
        .react-calendar {
          width: 100% !important;
          border: none !important;
          font-family: inherit !important;
          padding: 10px;
        }
        /* Header del calendario */
        .react-calendar__navigation {
          margin-bottom: 20px !important;
          height: 44px !important;
        }
        .react-calendar__navigation button {
          font-weight: 800 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.1em !important;
          font-size: 0.8rem !important;
          color: #111827 !important;
          border-radius: 12px !important;
        }
        .react-calendar__navigation button:hover {
          background-color: #f3f4f6 !important;
        }
        /* Días de la semana */
        .react-calendar__month-view__weekdays {
          font-weight: 700 !important;
          text-transform: uppercase !important;
          font-size: 0.65rem !important;
          letter-spacing: 0.1em !important;
          color: #9ca3af !important;
          margin-bottom: 10px !important;
        }
        .react-calendar__month-view__weekdays abbr {
          text-decoration: none !important;
        }
        /* Los tiles (celdas) */
        .react-calendar__tile {
          padding: 1.25em 0.5em !important;
          font-weight: 700 !important;
          font-size: 0.9rem !important;
          color: #374151 !important;
          border-radius: 16px !important;
          transition: all 0.2s ease !important;
          position: relative !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
        }
        /* Día seleccionado */
        .react-calendar__tile--active {
          background: #4f46e5 !important;
          color: white !important;
          box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3) !important;
        }
        .react-calendar__tile--active:enabled:hover {
          background: #4338ca !important;
        }
        /* Día de hoy */
        .react-calendar__tile--now {
          background: #fef2f2 !important;
          color: #ef4444 !important;
        }
        /* Días deshabilitados (No disponible o Excepción) */
        .react-calendar__tile:disabled {
          background-color: transparent !important;
          color: #d1d5db !important;
          cursor: not-allowed !important;
          font-weight: 400 !important;
        }
        /* Indicador de Excepción */
        .exception-day {
          text-decoration: line-through !important;
          color: #9ca3af !important;
        }
        /* Efecto hover en días válidos */
        .react-calendar__tile:enabled:hover {
          background-color: #eef2ff !important;
          color: #4f46e5 !important;
        }
      `}</style>

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
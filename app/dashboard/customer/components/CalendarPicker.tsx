"use client";

import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useEffect, useState } from "react";

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
    async function fetchAvailability() {
      try {
        const res = await fetch(`/api/availability/${barberId}`);
        if (!res.ok) return;
        const data = await res.json();
        setAvailability(data.map((d: any) => d.dayOfWeek));
      } catch (error) {
        console.error("Failed to load availability", error);
      }
    }

    async function fetchExceptions() {
      try {
        const res = await fetch(`/api/exceptions/${barberId}`);
        if (!res.ok) return;
        const data = await res.json();
        setExceptions(data);
      } catch (error) {
        console.error("Failed to load exceptions", error);
      }
    }

    fetchAvailability();
    fetchExceptions();
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
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
      <Calendar
        value={selectedDate}
        onChange={(value) => setSelectedDate(value as Date)}
        locale="en-US"
        className="custom-calendar"
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
        tileContent={({ date, view }) => {
          if (view !== "month" || !isException(date)) return null;
          return (
            <div className="exception-tooltip"></div>
          );
        }}
      />
    </div>
  );
}
"use client";

import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useEffect, useState } from "react";

type Props = {
  barberId: string;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
};




export default function CalendarPicker({ selectedDate, setSelectedDate, barberId }: Props) {
  const [availability, setAvailability] = useState<number[]>([]);

  useEffect(() => {
    async function fetchAvailability() {
      try {
        const res = await fetch(`/api/availability/${barberId}`);

        if (!res.ok) {
          console.error("Failed to fetch availability");
          return;
        }

        const data = await res.json();

        const days = data.map((d: any) => d.dayOfWeek);

        setAvailability(days);

      } catch (error) {
        console.error("Failed to load availability", error);
      }
    }

    fetchAvailability();
  }, [barberId]);

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

          const day = date.getDay();

          return (
            date < today ||
            !availability.includes(day)
          );
        }}
      />

    </div>
  );
}
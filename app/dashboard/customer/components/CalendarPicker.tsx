"use client";

import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

type Props = {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
};

export default function CalendarPicker({ selectedDate, setSelectedDate }: Props) {
  return (
    <div className="bg-green-100 p-6 rounded-xl shadow-md">

      <Calendar
        value={selectedDate}
        onChange={(value) => setSelectedDate(value as Date)}
        locale="en-US"
      />

    </div>
  );
}
"use client";

import SlotCard from "./SlotCard";
import { useEffect, useState } from "react";

type Props = {
  selectedDate: Date;
  selectedService: string | null;
};

const mockSlots = [
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
];

export default function AvailableSlots({ selectedDate, selectedService, }: Props) {

  const [availability, setAvailability] = useState<any[]>([]);

  useEffect(() => {
    async function fetchAvailability() {
      try {
        const barberId = "2db47b73-5cd5-4726-a6d2-c91e70684ed6"; //temporary hardcoded barber ID

        const res = await fetch(`/api/availability/${barberId}`);

        if (!res.ok) {
          console.error("Failed to fetch availability");
          return;
        }

        const data = await res.json();
        setAvailability(data);

      } catch (error) {
        console.error("Error loading availability", error);
      }
    }

    fetchAvailability();
  }, []);

  const dayOfWeek = selectedDate.getDay();

  const schedule = availability.find(
    (a) => a.dayOfWeek === dayOfWeek
  );
  if (!schedule) {
    return <p>No availability for this day</p>;
  }

  function generateSlots(start: string, end: string, interval = 60) {
    const slots: string[] = [];

    const [startHour, startMinute] = start.split(":").map(Number);
    const [endHour, endMinute] = end.split(":").map(Number);

    const startDate = new Date(selectedDate);
    startDate.setHours(startHour, startMinute, 0, 0);

    const endDate = new Date(selectedDate);
    endDate.setHours(endHour, endMinute, 0, 0);

    const current = new Date(startDate);

    while (current < endDate) {
      slots.push(
        current.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );

      current.setMinutes(current.getMinutes() + interval);
    }

    return slots;
  }

  const slots = schedule
    ? generateSlots(schedule.startTime, schedule.endTime)
    : [];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 max-h-125 overflow-y-auto">

      <div className="mb-6">

        <h3 className="text-lg font-semibold text-gray-800">
          Available Slots
        </h3>

        <p className="text-sm text-gray-500">
          {selectedDate.toDateString()}
        </p>

        <p className="text-sm text-gray-400 mt-1">
          Working hours: {schedule.startTime} - {schedule.endTime}
        </p>

      </div>

      <div className="space-y-3">

        {slots.map((slot) => (
          <SlotCard
            key={slot}
            time={slot}
            service={selectedService}
          />
        ))}

      </div>

    </div>
  );
}
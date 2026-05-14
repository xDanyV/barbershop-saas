"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CalendarCheck } from "lucide-react";
import SlotCard from "./SlotCard";

type Props = {
  selectedDate: Date;
  selectedService: string | null;
  barberId: string;
};

export default function AvailableSlots({
  selectedDate,
  selectedService,
  barberId,
}: Props) {
  const [availability, setAvailability] = useState<any[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchAvailability() {
      try {
        const res = await fetch(`/api/availability/${barberId}`);
        if (!res.ok) return;
        const data = await res.json();
        setAvailability(data);
      } catch (error) {
        console.error("Error loading availability", error);
      }
    }
    fetchAvailability();
  }, [barberId]);

  useEffect(() => {
    setLoading(true);
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    fetch(
      `/api/appointments/barber/${barberId}/booked?start=${startOfDay.toISOString()}&end=${endOfDay.toISOString()}`
    )
      .then((res) => res.json())
      .then((data: string[]) => setBookedSlots(data))
      .catch((err) => console.error("Could not load booked slots", err))
      .finally(() => setLoading(false));
  }, [selectedDate, barberId]);

  const timeToMinutes = (timeStr: string) => {

    if (timeStr.includes("M")) {
      const [time, modifier] = timeStr.split(" ");
      let [hours, minutes] = time.split(":").map(Number);
      if (modifier === "PM" && hours < 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;
      return hours * 60 + minutes;
    }
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const dayOfWeek = selectedDate.getDay();
  const schedule = availability.find((a) => a.dayOfWeek === dayOfWeek);

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

  const allSlots = schedule
    ? generateSlots(schedule.startTime, schedule.endTime)
    : [];

  const availableSlots = allSlots.filter((slot) => {
    if (bookedSlots.includes(slot)) return false;

    if (schedule?.breakStart && schedule?.breakEnd) {
      const slotMin = timeToMinutes(slot);
      const breakStartMin = timeToMinutes(schedule.breakStart);
      const breakEndMin = timeToMinutes(schedule.breakEnd);

      if (slotMin >= breakStartMin && slotMin < breakEndMin) {
        return false;
      }
    }

    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();

    if (isToday) {
      const slotMin = timeToMinutes(slot);
      const nowMin = now.getHours() * 60 + now.getMinutes();
      return slotMin > nowMin;
    }

    return true;
  });

  if (!schedule) {
    return (
      <div className="bg-amber-50 border border-amber-100 rounded-3xl md:rounded-4xl p-6 md:p-8 text-center">
        <Clock className="mx-auto text-amber-400 mb-2" size={24} />
        <p className="text-amber-800 font-bold">No availability</p>
        <p className="text-amber-600 text-xs">The barber is not working on this day.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-4xl md:rounded-[2.5rem] shadow-xl shadow-gray-100/50 p-5 md:p-6 flex flex-col h-100 md:h-125">
      <div className="mb-5 md:mb-6 shrink-0 space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">
            Available Slots
          </h3>
        </div>

        <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-gray-400">
          <CalendarCheck size={14} className="text-indigo-500" />
          <span>
            {schedule.startTime} — {schedule.endTime}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-visible pr-1 md:pr-2 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 md:h-16 bg-gray-50 animate-pulse rounded-xl md:rounded-2xl w-full" />
              ))}
            </div>
          ) : availableSlots.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 md:py-20">
              <p className="text-gray-400 font-bold text-sm md:text-base">Sold Out!</p>
            </motion.div>
          ) : (
            <div className="grid gap-2 md:gap-3">
              {availableSlots.map((slot, index) => (
                <motion.div
                  key={slot}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <SlotCard
                    time={slot}
                    selectedDate={selectedDate}
                    barberId={barberId}
                    onBook={(bookedTime) => setBookedSlots((prev) => [...prev, bookedTime])}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
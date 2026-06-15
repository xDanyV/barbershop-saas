"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock } from "lucide-react";
import SlotCard from "./SlotCard";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("AvailableSlots");
  const [availability, setAvailability] = useState<any[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch barber availability (working hours & days)
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

  // Fetch booked slots for the selected date and normalize to 12h format
  useEffect(() => {
    setLoading(true);

    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Send the browser's timezone offset so the server formats booked slot
    // times in local time, matching the format generateSlots() produces.
    const tzOffset = new Date().getTimezoneOffset();

    fetch(
      `/api/appointments/barber/${barberId}/booked?start=${startOfDay.toISOString()}&end=${endOfDay.toISOString()}&tzOffset=${tzOffset}`
    )
      .then((res) => res.json())
      .then((data: string[]) => {
        // Server now returns pre-formatted "HH:MM AM/PM" strings
        // adjusted to the browser's local timezone via the tzOffset param.
        setBookedSlots(data);
      })
      .catch((err) => console.error("Could not load booked slots", err))
      .finally(() => setLoading(false));
  }, [selectedDate, barberId]);

  // Convert any time string (12h or 24h) to total minutes
  const timeToMinutes = (timeStr: string): number => {
    if (timeStr.includes("M")) {
      // 12h format: "08:00 AM" / "01:30 PM"
      const [time, modifier] = timeStr.split(" ");
      let [hours, minutes] = time.split(":").map(Number);
      if (modifier === "PM" && hours < 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;
      return hours * 60 + minutes;
    }
    // 24h format: "08:00"
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const dayOfWeek = selectedDate.getDay();
  const schedule = availability.find((a) => a.dayOfWeek === dayOfWeek);

  // Generate hourly slots between start and end time
  function generateSlots(start: string, end: string, interval = 60): string[] {
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
    // Remove already-booked slots (normalized comparison)
    if (bookedSlots.includes(slot)) return false;

    // Remove slots that fall within the break window
    if (schedule?.breakStart && schedule?.breakEnd) {
      const slotMin = timeToMinutes(slot);
      const breakStartMin = timeToMinutes(schedule.breakStart);
      const breakEndMin = timeToMinutes(schedule.breakEnd);
      if (slotMin >= breakStartMin && slotMin < breakEndMin) return false;
    }

    // Remove past slots for today
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
      <div className="rounded-3xl border border-amber-100 bg-amber-50/70 p-6 md:p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-amber-500 shadow-sm">
          <Clock size={22} />
        </div>

        <p className="text-sm md:text-base font-black text-amber-900">
          {t("noAvailability.title")}
        </p>

        <p className="mt-1 text-xs md:text-sm text-amber-700">
          {t("noAvailability.subtitle")}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-4 md:p-5">
      <div className="mb-4 flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl md:text-2xl font-black tracking-tight text-gray-900">
            Horarios disponibles
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center rounded-2xl bg-indigo-50 px-3 py-2 text-[11px] font-black text-indigo-600">
            {schedule.startTime} — {schedule.endTime}
          </div>

          {!loading && (
            <div className="inline-flex items-center rounded-2xl bg-gray-50 px-3 py-2 text-[11px] font-black text-gray-500">
              {availableSlots.length} disponible
              {availableSlots.length === 1 ? "" : "s"}
            </div>
          )}
        </div>
      </div>

      <div className="max-h-140 overflow-y-auto overflow-x-visible pr-1 md:max-h-155 md:pr-2 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-16 w-full animate-pulse rounded-2xl bg-gray-50"
                />
              ))}
            </div>
          ) : availableSlots.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-gray-400 shadow-sm">
                <Clock size={24} />
              </div>

              <p className="text-sm md:text-base font-black text-gray-700">
                {t("soldOut")}
              </p>

              <p className="mt-2 max-w-sm text-xs md:text-sm text-gray-400">
                Intenta seleccionar otra fecha o cambiar de barbero para ver más horarios.
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {availableSlots.map((slot, index) => (
                <motion.div
                  key={slot}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="min-w-0"
                >
                  <SlotCard
                    time={slot}
                    selectedDate={selectedDate}
                    barberId={barberId}
                    onBook={(bookedTime) =>
                      setBookedSlots((prev) => [...prev, bookedTime])
                    }
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
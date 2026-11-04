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

type Slot = {
  start: string;
  label: string;
  maxMinutes: number;
};

type DayResponse = {
  timezone: string;
  schedule: { startTime: string; endTime: string } | null;
  slots: Slot[];
};

// The calendar day the customer picked, interpreted by the server in the business timezone
function toDateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export default function AvailableSlots({
  selectedDate,
  barberId,
}: Props) {
  const t = useTranslations("AvailableSlots");
  const [schedule, setSchedule] = useState<DayResponse["schedule"]>(null);
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  // Request the current data belongs to; while it differs from the selected one we are loading
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const requestKey = `${barberId}|${toDateKey(selectedDate)}`;
  const loading = loadedKey !== requestKey;

  // Slots are computed server-side (working hours, break, bookings, exceptions, timezone)
  useEffect(() => {
    let ignore = false;
    const dateKey = requestKey.split("|")[1];

    fetch(`/api/availability/${barberId}/slots?date=${dateKey}`)
      .then((res) => (res.ok ? res.json() : null))
      .catch((err) => {
        console.error("Could not load slots", err);
        return null;
      })
      .then((data: DayResponse | null) => {
        if (ignore) return;
        setSchedule(data?.schedule ?? null);
        setAvailableSlots(data?.slots ?? []);
        setLoadedKey(requestKey);
      });

    return () => {
      ignore = true;
    };
  }, [requestKey, barberId]);

  if (!schedule && !loading) {
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
            {t("title")}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {schedule && (
            <div className="inline-flex items-center rounded-2xl bg-indigo-50 px-3 py-2 text-xs font-black text-indigo-600">
              {schedule.startTime} — {schedule.endTime}
            </div>
          )}

          {!loading && (
            <div className="inline-flex items-center rounded-2xl bg-gray-50 px-3 py-2 text-xs font-black text-gray-500">
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
                {t("soldOutHint")}
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {availableSlots.map((slot, index) => (
                <motion.div
                  key={slot.start}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="min-w-0"
                >
                  <SlotCard
                    time={slot.label}
                    start={slot.start}
                    maxMinutes={slot.maxMinutes}
                    selectedDate={selectedDate}
                    barberId={barberId}
                    onBook={(bookedStart) =>
                      setAvailableSlots((prev) =>
                        prev.filter((s) => s.start !== bookedStart)
                      )
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
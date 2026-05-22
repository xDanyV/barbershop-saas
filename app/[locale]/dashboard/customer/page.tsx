"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Calendar as CalendarIcon, Clock, ChevronLeft } from "lucide-react";
import CalendarPicker from "./components/CalendarPicker";
import AvailableSlots from "./components/AvailableSlots";
import BarberCard from "./components/BarberCard";
import { useTranslations } from "next-intl";

type Barber = {
  id: string;
  user: {
    name: string | null;
    email: string;
    phone: string;
  };
};

export default function CustomerDashboard() {
  const t = useTranslations("CustomerDashboard");
  const searchParams = useSearchParams();
  const router = useRouter();
  const barberId = searchParams.get("barberId");

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [barber, setBarber] = useState<Barber | null>(null);

  useEffect(() => {
    if (!barberId) {
      router.replace("/dashboard/customer/barbers");
      return;
    }

    fetch("/api/barbers")
      .then((res) => res.json())
      .then((barbers: Barber[]) => {
        const found = barbers.find((b) => b.id === barberId);
        if (!found) {
          router.replace("/dashboard/customer/barbers");
        } else {
          setBarber(found);
        }
      })
      .catch(() => router.replace("/dashboard/customer/barbers"));
  }, [barberId, router]);

  if (!barberId || !barber) return null;

  const displayDate = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-6xl mx-auto px-3 pb-24 md:pb-0 md:p-10">
      <button
        onClick={() => router.push("/dashboard/customer/barbers")}
        className="flex items-center gap-2 text-gray-400 hover:text-indigo-600 font-bold text-[10px] md:text-xs uppercase tracking-widest mb-6 md:mb-8 transition-colors group py-2"
      >
        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        {t("backToBarbers")}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="order-1 lg:col-span-7 space-y-6 md:space-y-8"
        >
          <div className="sticky top-16 lg:static z-20 bg-white/95 backdrop-blur-sm -mx-4 px-4 py-4 lg:p-0 lg:bg-transparent lg:backdrop-blur-none transition-all">
            <div className="space-y-2 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 text-indigo-600 font-black text-[10px] md:text-xs uppercase tracking-[0.2em]">
                <CalendarIcon size={14} />
                {t("step1")}
              </div>
              <h2 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight">
                {displayDate}
              </h2>
            </div>
          </div>

          <div className="bg-white p-2 rounded-4xl md:rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
            <CalendarPicker
              barberId={barberId}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
            />
          </div>
          <p className="text-center text-[10px] md:text-xs text-gray-400 font-medium px-4 md:px-8">
            {t("note")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="order-2 lg:col-span-5 space-y-6"
        >
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-4xl md:rounded-4xl border border-indigo-50 shadow-sm">
              <BarberCard barber={barber} />
            </div>
          </div>

          <div className="bg-gray-50/50 rounded-4xl md:rounded-[2.5rem] py-6 md:py-0">
            <div className="flex items-center justify-center pb-4 gap-2 text-indigo-600 font-black text-[10px] md:text-xs uppercase tracking-[0.2em]">
              <Clock size={14} />
              {t("step2")}
            </div>

            <AvailableSlots
              barberId={barberId}
              selectedDate={selectedDate}
              selectedService={selectedService}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
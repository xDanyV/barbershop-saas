"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Calendar as CalendarIcon, Clock, ChevronLeft } from "lucide-react";
import CalendarPicker from "./components/CalendarPicker";
import AvailableSlots from "./components/AvailableSlots";
import BarberCard from "./components/BarberCard";

type Barber = {
  id: string;
  user: {
    name: string | null;
    email: string;
    phone: string;
  };
};

export default function CustomerDashboard() {
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

  // Formateador para el título de la fecha
  const displayDate = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10">
      {/* Botón de volver */}
      <button
        onClick={() => router.push("/dashboard/customer/barbers")}
        className="flex items-center gap-2 text-gray-400 hover:text-indigo-600 font-bold text-xs uppercase tracking-widest mb-8 transition-colors group"
      >
        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to Barbers
      </button>

      <div className="grid lg:grid-cols-12 gap-12 items-start">

        {/* LEFT SIDE: Calendar & Date Selection */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-7 space-y-8"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-[0.2em]">
              <CalendarIcon size={14} />
              Step 1: Select Date
            </div>
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">
              {displayDate}
            </h2>
          </div>

          <div className="bg-white p-2 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/50">
            <CalendarPicker
              barberId={barberId}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
            />
          </div>
          <p className="text-center text-xs text-gray-400 font-medium px-8">
            Note: Cancellations are only allowed up to 2 hours before the appointment.
          </p>
        </motion.div>

        {/* RIGHT SIDE: Barber Info & Time Slots */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-5 space-y-6"
        >
          {/* Barber Info Card Section */}
          <div className="space-y-4">

            {/* BarberCard estilizado (asumiendo su estructura interna) */}
            <div className="relative overflow-hidden rounded-4xl border border-indigo-50 shadow-sm">
              <BarberCard barber={barber} />
            </div>
          </div>

          {/* Slots Section */}
          <div className="bg-gray-50/50 rounded-[2.5rem] ">
            <div className="flex items-center justify-center pb-2 gap-2 text-indigo-600 font-black text-xs uppercase tracking-[0.2em]">
              <Clock size={14} />
              Step 2: Choose Time
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
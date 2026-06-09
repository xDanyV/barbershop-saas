"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar as CalendarIcon, Clock, ChevronLeft, UserRound } from "lucide-react";
import Link from "next/link";

import CalendarPicker from "@/[locale]/dashboard/customer/components/CalendarPicker";
import AvailableSlots from "@/[locale]/dashboard/customer/components/AvailableSlots";
import BarberCard from "@/[locale]/dashboard/customer/components/BarberCard";

type Barber = {
    id: string;
    user: {
        name: string | null;
        email: string;
        phone: string;
    };
};

type Props = {
    locale: string;
    business: {
        name: string;
        slug: string;
        description: string | null;
        barbers: Barber[];
    };
};

export default function BusinessBookingClient({ locale, business }: Props) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedBarberId, setSelectedBarberId] = useState(
        business.barbers[0]?.id ?? null
    );
    const [selectedService] = useState<string | null>(null);

    const selectedBarber =
        business.barbers.find((barber) => barber.id === selectedBarberId) ?? null;

    const displayDate = selectedDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
    });

    if (business.barbers.length === 0) {
        return (
            <main className="min-h-screen bg-[#0a0a0f] text-white">
                <div className="max-w-5xl mx-auto px-4 py-10">
                    <Link
                        href={`/${locale}/business/${business.slug}`}
                        className="inline-flex items-center gap-2 text-sm text-indigo-300 hover:text-indigo-200 mb-8"
                    >
                        <ChevronLeft size={16} />
                        Volver al perfil
                    </Link>

                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                        <h1 className="text-3xl font-black">{business.name}</h1>
                        <p className="text-gray-400 mt-3">
                            Este negocio aún no tiene barberos disponibles para reservar.
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    if (!selectedBarberId || !selectedBarber) return null;

    return (
        <main className="min-h-screen bg-[#F8FAFC] text-gray-900">
            <div className="max-w-6xl mx-auto px-3 pb-24 md:pb-0 md:p-10">
                <Link
                    href={`/${locale}/business/${business.slug}`}
                    className="flex items-center gap-2 text-gray-400 hover:text-indigo-600 font-bold text-[10px] md:text-xs uppercase tracking-widest mb-6 md:mb-8 transition-colors group py-2"
                >
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Volver al perfil
                </Link>

                <div className="mb-8 bg-white border border-gray-100 rounded-4xl p-6 shadow-xl shadow-gray-100/50">
                    <p className="text-indigo-600 font-black text-[10px] md:text-xs uppercase tracking-[0.2em] mb-2">
                        Reservar cita
                    </p>

                    <h1 className="text-2xl md:text-4xl font-black tracking-tight">
                        {business.name}
                    </h1>

                    {business.description && (
                        <p className="text-gray-500 text-sm mt-2 max-w-2xl">
                            {business.description}
                        </p>
                    )}
                </div>

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
                                    Elige una fecha
                                </div>

                                <h2 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight">
                                    {displayDate}
                                </h2>
                            </div>
                        </div>

                        <div className="bg-white p-2 rounded-4xl md:rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
                            <CalendarPicker
                                barberId={selectedBarberId}
                                selectedDate={selectedDate}
                                setSelectedDate={setSelectedDate}
                            />
                        </div>

                        <p className="text-center text-[10px] md:text-xs text-gray-400 font-medium px-4 md:px-8">
                            Solo se muestran días y horarios disponibles para el barbero seleccionado.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="order-2 lg:col-span-5 space-y-6"
                    >
                        <div className="bg-white rounded-4xl border border-gray-100 shadow-xl shadow-gray-100/50 p-5">
                            <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] md:text-xs uppercase tracking-[0.2em] mb-4">
                                <UserRound size={14} />
                                Elige un barbero
                            </div>

                            <div className="space-y-3">
                                {business.barbers.map((barber) => (
                                    <button
                                        key={barber.id}
                                        onClick={() => setSelectedBarberId(barber.id)}
                                        className={`w-full text-left rounded-2xl border p-4 transition-all ${selectedBarberId === barber.id
                                                ? "border-indigo-500 bg-indigo-50"
                                                : "border-gray-100 bg-gray-50 hover:bg-gray-100"
                                            }`}
                                    >
                                        <p className="font-black text-gray-900">
                                            {barber.user.name || "Barbero"}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Seleccionar para ver disponibilidad
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="relative overflow-hidden rounded-4xl md:rounded-4xl border border-indigo-50 shadow-sm">
                            <BarberCard barber={selectedBarber} />
                        </div>

                        <div className="bg-gray-50/50 rounded-4xl md:rounded-[2.5rem] py-6 md:py-0">
                            <div className="flex items-center justify-center pb-4 gap-2 text-indigo-600 font-black text-[10px] md:text-xs uppercase tracking-[0.2em]">
                                <Clock size={14} />
                                Elige un horario
                            </div>

                            <AvailableSlots
                                barberId={selectedBarberId}
                                selectedDate={selectedDate}
                                selectedService={selectedService}
                            />
                        </div>
                    </motion.div>
                </div>
            </div>
        </main>
    );
}
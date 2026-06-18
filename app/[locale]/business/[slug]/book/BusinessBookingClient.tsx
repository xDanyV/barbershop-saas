"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowRight,
    Calendar as CalendarIcon,
    CheckCircle2,
    ChevronLeft,
    Clock,
    Scissors,
    UserRound,
} from "lucide-react";
import Link from "next/link";

import CalendarPicker from "@/[locale]/dashboard/customer/components/CalendarPicker";
import AvailableSlots from "@/[locale]/dashboard/customer/components/AvailableSlots";
import BarberCard from "@/[locale]/dashboard/customer/components/BarberCard";

type Barber = {
    id: string;
    profileImageUrl: string | null;
    user: {
        name: string | null;
        email: string;
        phone: string;
    };
};

type BookingStep = "details" | "slots";

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
    const [selectedBarberId, setSelectedBarberId] = useState<string | null>(
        business.barbers[0]?.id ?? null
    );
    const [selectedService] = useState<string | null>(null);
    const [step, setStep] = useState<BookingStep>("details");

    const selectedBarber = useMemo(() => {
        return (
            business.barbers.find((barber) => barber.id === selectedBarberId) ??
            null
        );
    }, [business.barbers, selectedBarberId]);

    const displayDate = selectedDate.toLocaleDateString("es-MX", {
        weekday: "long",
        month: "long",
        day: "numeric",
    });

    const shortDisplayDate = selectedDate.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

    const canContinue = Boolean(selectedBarberId && selectedBarber);

    const handleChangeBarber = (barberId: string) => {
        setSelectedBarberId(barberId);
    };

    const handleContinueToSlots = () => {
        if (!canContinue) return;
        setStep("slots");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleBackToDetails = () => {
        setStep("details");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    if (business.barbers.length === 0) {
        return (
            <main className="min-h-screen bg-[#F8FAFC] text-gray-900">
                <BookingNavbar locale={locale} slug={business.slug} />

                <div className="max-w-5xl mx-auto px-4 py-10">
                    <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
                        <h1 className="text-3xl font-black text-gray-900">
                            {business.name}
                        </h1>
                        <p className="text-gray-500 mt-3">
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
            <BookingNavbar locale={locale} slug={business.slug} />

            <div className="max-w-6xl mx-auto px-4 pt-6 pb-32 md:px-8 md:py-10">
                <BookingHero business={business} />

                <BookingSteps currentStep={step} />

                <AnimatePresence mode="wait">
                    {step === "details" ? (
                        <motion.section
                            key="details-step"
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -18 }}
                            transition={{ duration: 0.25 }}
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 lg:gap-8 items-start">
                                <section className="bg-white border border-gray-100 rounded-4xl p-5 md:p-6 shadow-xl shadow-gray-100/50">
                                    <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] md:text-xs uppercase tracking-[0.2em] mb-4">
                                        <UserRound size={14} />
                                    </div>

                                    <h2 className="text-2xl font-black text-gray-900">
                                        Elige un barbero
                                    </h2>

                                    <div className="mt-5 space-y-3">
                                        {business.barbers.map((barber) => {
                                            const isSelected =
                                                selectedBarberId === barber.id;

                                            return (
                                                <button
                                                    key={barber.id}
                                                    type="button"
                                                    onClick={() =>
                                                        handleChangeBarber(barber.id)
                                                    }
                                                    className={`w-full text-left rounded-3xl border p-4 transition-all ${isSelected
                                                        ? "border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-100/70"
                                                        : "border-gray-100 bg-gray-50 hover:bg-gray-100"
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div
                                                            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black shrink-0 overflow-hidden ${isSelected
                                                                    ? "bg-indigo-600 text-white"
                                                                    : "bg-white text-indigo-600"
                                                                }`}
                                                        >
                                                            {barber.profileImageUrl ? (
                                                                <img
                                                                    src={barber.profileImageUrl}
                                                                    alt={barber.user.name || "Barbero"}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                getInitials(barber.user.name || "Barbero")
                                                            )}
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-black text-gray-900 truncate">
                                                                {barber.user.name ||
                                                                    "Barbero"}
                                                            </p>
                                                        </div>

                                                        {isSelected && (
                                                            <CheckCircle2
                                                                size={20}
                                                                className="text-indigo-600 shrink-0"
                                                            />
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <div className="bg-white border border-gray-100 rounded-4xl p-5 md:p-6 shadow-xl shadow-gray-100/50">
                                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5">
                                            <div>
                                                <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] md:text-xs uppercase tracking-[0.2em] mb-2">
                                                    <CalendarIcon size={14} />
                                                </div>

                                                <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight capitalize">
                                                    {displayDate}
                                                </h2>
                                            </div>

                                            <div className="rounded-2xl bg-indigo-50 text-indigo-600 px-4 py-2 text-xs font-black">
                                                {selectedBarber.user.name || "Barbero"}
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-4xl border border-gray-100 overflow-hidden">
                                            <CalendarPicker
                                                barberId={selectedBarberId}
                                                selectedDate={selectedDate}
                                                setSelectedDate={setSelectedDate}
                                            />
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <div className="sticky bottom-4 z-30">
                                <div className="max-w-6xl mx-auto bg-white/95 backdrop-blur-xl border border-gray-100 rounded-3xl p-4 shadow-2xl shadow-gray-300/30">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div>
                                            <p className="text-sm md:text-base font-black text-gray-900">
                                                {selectedBarber.user.name || "Barbero"} ·{" "}
                                                <span className="capitalize">
                                                    {shortDisplayDate}
                                                </span>
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleContinueToSlots}
                                            disabled={!canContinue}
                                            className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 text-sm font-black disabled:opacity-50 transition-all"
                                        >
                                            Ver horarios disponibles
                                            <ArrowRight size={17} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.section>
                    ) : (
                        <motion.section
                            key="slots-step"
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -18 }}
                            transition={{ duration: 0.25 }}
                            className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 lg:gap-8 items-start"
                        >
                            <aside className="space-y-5">
                                <button
                                    type="button"
                                    onClick={handleBackToDetails}
                                    className="inline-flex items-center gap-2 text-gray-400 hover:text-indigo-600 font-black text-xs uppercase tracking-widest transition-colors"
                                >
                                    <ChevronLeft size={16} />
                                    Cambiar barbero o fecha
                                </button>

                                <div className="bg-white border border-gray-100 rounded-4xl p-5 shadow-xl shadow-gray-100/50">
                                    <h2 className="text-2xl font-black text-gray-900 capitalize">
                                        {shortDisplayDate}
                                    </h2>

                                    <div className="mt-5 rounded-4xl overflow-hidden border border-indigo-50">
                                        <BarberCard barber={selectedBarber} />
                                    </div>
                                </div>
                            </aside>

                            <section className="bg-white border border-gray-100 rounded-4xl p-4 md:p-6 shadow-xl shadow-gray-100/50">

                                <AvailableSlots
                                    barberId={selectedBarberId}
                                    selectedDate={selectedDate}
                                    selectedService={selectedService}
                                />
                            </section>
                        </motion.section>
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}

function BookingNavbar({
    locale,
    slug,
}: {
    locale: string;
    slug: string;
}) {
    return (
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100">
            <div className="max-w-6xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-4">
                <Link
                    href={`/${locale}/business/${slug}`}
                    className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors"
                >
                    <ChevronLeft size={17} />
                    <span className="hidden sm:inline text-xs font-black uppercase tracking-widest">
                        Volver al perfil
                    </span>
                </Link>

                <Link
                    href={`/${locale}/business/${slug}`}
                    className="flex items-center gap-2"
                >
                    <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center">
                        <Scissors size={18} />
                    </div>
                    <div className="leading-tight">
                        <p className="text-sm font-black text-gray-900">
                            BarberSaaS
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Reservas
                        </p>
                    </div>
                </Link>

                <div className="w-8 sm:w-28" />
            </div>
        </header>
    );
}

function BookingHero({
    business,
}: {
    business: {
        name: string;
        description: string | null;
    };
}) {
    return (
        <section className="mb-6 md:mb-8 bg-white border border-gray-100 rounded-4xl p-5 md:p-7 shadow-xl shadow-gray-100/50">
            <p className="text-indigo-600 font-black text-[10px] md:text-xs uppercase tracking-[0.2em] mb-2">
                Reservar cita
            </p>

            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-gray-900">
                {business.name}
            </h1>

            {business.description && (
                <p className="text-gray-500 text-sm mt-2 max-w-2xl">
                    {business.description}
                </p>
            )}
        </section>
    );
}

function BookingSteps({ currentStep }: { currentStep: BookingStep }) {
    const steps = [
        {
            id: "details",
            label: "Barbero y fecha",
            number: "1",
        },
        {
            id: "slots",
            label: "Horario",
            number: "2",
        },
        {
            id: "confirm",
            label: "Confirmar",
            number: "3",
        },
    ];

    const getStatus = (id: string) => {
        if (id === "details") {
            return currentStep === "details" ? "active" : "complete";
        }

        if (id === "slots") {
            return currentStep === "slots" ? "active" : "pending";
        }

        return "pending";
    };

    return (
        <div className="mb-6 bg-white border border-gray-100 rounded-3xl p-2 shadow-sm overflow-hidden">
            <div className="grid grid-cols-3 gap-2">
                {steps.map((step) => {
                    const status = getStatus(step.id);

                    return (
                        <div
                            key={step.id}
                            className={`rounded-2xl px-2 md:px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-center sm:justify-start gap-2 transition-all ${status === "active"
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                                : status === "complete"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-gray-50 text-gray-400"
                                }`}
                        >
                            <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black mx-auto sm:mx-0 ${status === "active"
                                    ? "bg-white/15 text-white"
                                    : status === "complete"
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-white text-gray-400"
                                    }`}
                            >
                                {status === "complete" ? (
                                    <CheckCircle2 size={16} />
                                ) : (
                                    step.number
                                )}
                            </div>

                            <p className="text-[11px] md:text-sm font-black text-center sm:text-left leading-tight">
                                {step.label}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function getInitials(name: string) {
    return name
        .split(" ")
        .filter(Boolean)
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}
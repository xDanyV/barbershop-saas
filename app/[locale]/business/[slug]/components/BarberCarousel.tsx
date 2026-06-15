"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, PanInfo } from "framer-motion";
import {
    ArrowLeft,
    ArrowRight,
    CalendarDays,
    Pause,
    Play,
    Scissors,
    Users,
} from "lucide-react";
import { getInitials } from "../lib/business-page.utils";

type BarberItem = {
    id: string;
    name: string;
    imageUrl: string | null;
};

type Props = {
    barbers: BarberItem[];
    bookUrl: string;
};

const AUTO_PLAY_DELAY = 4500;

export default function BarberCarousel({ barbers, bookUrl }: Props) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [direction, setDirection] = useState(1);

    const hasMultipleBarbers = barbers.length > 1;

    useEffect(() => {
        if (!hasMultipleBarbers || isPaused) return;

        const interval = window.setInterval(() => {
            setDirection(1);
            setActiveIndex((current) =>
                current === barbers.length - 1 ? 0 : current + 1
            );
        }, AUTO_PLAY_DELAY);

        return () => window.clearInterval(interval);
    }, [hasMultipleBarbers, isPaused, barbers.length]);

    if (barbers.length === 0) {
        return (
            <div className="bg-white/6 border border-white/10 rounded-4xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 text-indigo-300 flex items-center justify-center">
                        <Users size={22} />
                    </div>

                    <div>
                        <h2 className="text-2xl font-black">Nuestro equipo</h2>
                        <p className="text-gray-400 text-sm">
                            No hay barberos disponibles.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const activeBarber = barbers[activeIndex];

    const goPrevious = () => {
        setDirection(-1);
        setActiveIndex((current) =>
            current === 0 ? barbers.length - 1 : current - 1
        );
    };

    const goNext = () => {
        setDirection(1);
        setActiveIndex((current) =>
            current === barbers.length - 1 ? 0 : current + 1
        );
    };

    const goToBarber = (index: number) => {
        setDirection(index > activeIndex ? 1 : -1);
        setActiveIndex(index);
    };

    const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const swipeDistance = info.offset.x;

        if (swipeDistance < -60) {
            goNext();
            return;
        }

        if (swipeDistance > 60) {
            goPrevious();
        }
    };

    return (
        <div
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            className="bg-white/6 border border-white/10 rounded-4xl p-5 md:p-8 overflow-hidden"
        >
            <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 text-indigo-300 flex items-center justify-center shrink-0">
                        <Users size={22} />
                    </div>

                    <div className="min-w-0">
                        <h2 className="text-2xl font-black">Nuestro equipo</h2>
                        <p className="text-gray-400 text-sm">
                            Conoce a los barberos disponibles.
                        </p>
                    </div>
                </div>

                {hasMultipleBarbers && (
                    <div className="flex gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => setIsPaused((prev) => !prev)}
                            className="hidden sm:flex w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 items-center justify-center transition-colors"
                            aria-label={isPaused ? "Reproducir carrusel" : "Pausar carrusel"}
                        >
                            {isPaused ? <Play size={16} /> : <Pause size={16} />}
                        </button>

                        <button
                            type="button"
                            onClick={goPrevious}
                            className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
                            aria-label="Barbero anterior"
                        >
                            <ArrowLeft size={17} />
                        </button>

                        <button
                            type="button"
                            onClick={goNext}
                            className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
                            aria-label="Siguiente barbero"
                        >
                            <ArrowRight size={17} />
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 items-center">
                <motion.div
                    drag={hasMultipleBarbers ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.18}
                    onDragEnd={handleDragEnd}
                    className="relative h-72 md:h-84 rounded-4xl overflow-hidden bg-linear-to-br from-indigo-500 to-purple-700 border border-white/10 cursor-grab active:cursor-grabbing"
                >
                    <AnimatePresence mode="wait" custom={direction}>
                        {activeBarber.imageUrl ? (
                            <motion.img
                                key={activeBarber.id}
                                src={activeBarber.imageUrl}
                                alt={activeBarber.name}
                                custom={direction}
                                initial={{ opacity: 0, x: direction * 80, scale: 1.03 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: direction * -80, scale: 0.98 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <motion.div
                                key={activeBarber.id}
                                custom={direction}
                                initial={{ opacity: 0, x: direction * 80, scale: 0.96 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: direction * -80, scale: 0.96 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className="w-full h-full flex items-center justify-center"
                            >
                                <span className="text-white text-7xl md:text-8xl font-black tracking-tighter">
                                    {getInitials(activeBarber.name)}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="absolute inset-0 bg-linear-to-t from-black/55 via-transparent to-transparent pointer-events-none" />

                    <div className="absolute left-5 right-5 bottom-5">
                        <p className="text-white text-2xl font-black leading-tight">
                            {activeBarber.name}
                        </p>
                        <p className="text-indigo-100 text-xs font-black uppercase tracking-widest mt-1">
                            Barbero profesional
                        </p>
                    </div>
                </motion.div>

                <div>
                    <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-400/20 text-indigo-200 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] mb-4">
                        <Scissors size={13} />
                        Barbero destacado
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeBarber.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.25 }}
                        >
                            <h3 className="text-3xl md:text-4xl font-black tracking-tight">
                                {activeBarber.name}
                            </h3>

                            <p className="text-gray-400 mt-3 leading-relaxed">
                                Selecciona tu servicio y horario disponible para reservar una cita con el equipo de este negocio.
                            </p>
                        </motion.div>
                    </AnimatePresence>

                    <Link
                        href={bookUrl}
                        className="mt-6 inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black px-5 py-3 rounded-2xl transition-colors"
                    >
                        <CalendarDays size={17} />
                        Reservar cita
                    </Link>

                    {hasMultipleBarbers && (
                        <>
                            <div className="mt-7 flex gap-3 overflow-x-auto pb-2">
                                {barbers.map((barber, index) => (
                                    <button
                                        key={barber.id}
                                        type="button"
                                        onClick={() => goToBarber(index)}
                                        className={`shrink-0 w-14 h-14 rounded-2xl overflow-hidden border transition-all ${activeIndex === index
                                            ? "border-indigo-300 scale-105 opacity-100"
                                            : "border-white/10 opacity-60 hover:opacity-100"
                                            }`}
                                        aria-label={`Ver barbero ${barber.name}`}
                                    >
                                        {barber.imageUrl ? (
                                            <img
                                                src={barber.imageUrl}
                                                alt={barber.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-linear-to-br from-indigo-500 to-purple-700 flex items-center justify-center text-white font-black text-sm">
                                                {getInitials(barber.name)}
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-4 flex items-center gap-2">
                                {barbers.map((barber, index) => (
                                    <button
                                        key={barber.id}
                                        type="button"
                                        onClick={() => goToBarber(index)}
                                        className={`h-2 rounded-full transition-all ${activeIndex === index
                                            ? "w-8 bg-indigo-400"
                                            : "w-2 bg-white/20 hover:bg-white/40"
                                            }`}
                                        aria-label={`Ir al barbero ${index + 1}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
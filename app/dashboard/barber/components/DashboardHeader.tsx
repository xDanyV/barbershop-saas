"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AvailabilityPopover from "./AvailabilityPopover";
import ExceptionModal from "./ExceptionModal";
import { Clock, Calendar as CalendarIcon, Scissors, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
    onExceptionAdded: () => void;
};

export default function DashboardHeader({ onExceptionAdded }: Props) {
    const router = useRouter();
    const [time, setTime] = useState<Date | null>(null);
    const [exceptionOpen, setExceptionOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const update = () => setTime(new Date());
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            // Solo activamos el modo compacto en móviles para no afectar escritorio
            if (window.innerWidth < 1024) {
                setIsScrolled(window.scrollY > 10);
            } else {
                setIsScrolled(false);
            }
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    if (!time) return null;

    return (
        <>
            <header
                className={`
                    sticky top-[64px] lg:static z-30
                    bg-white transition-all duration-300 ease-in-out
                    ${isScrolled
                        ? "py-2 shadow-lg border-b border-gray-100 px-4"
                        : "py-6 px-4 lg:px-0 mb-4"}
                `}
            >
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">

                    {/* SECCIÓN IZQUIERDA: Fecha y Hora */}
                    <div className={`flex transition-all duration-300 ${isScrolled ? "flex-row items-center justify-between w-full lg:w-auto" : "flex-col space-y-1"}`}>
                        <div className="flex flex-col">
                            <AnimatePresence>
                                {!isScrolled && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="flex items-center gap-2 text-indigo-600 font-bold mb-1"
                                    >
                                        <CalendarIcon size={14} />
                                        <span className="uppercase text-[10px] tracking-widest">Barber Management</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <h1 className={`font-black text-gray-900 tracking-tight transition-all duration-300 ${isScrolled ? "text-xl" : "text-3xl md:text-4xl"}`}>
                                {isScrolled
                                    ? time.toLocaleDateString("en-US", { day: "2-digit", month: "short" })
                                    : time.toLocaleDateString("en-US", { day: "2-digit", month: "long", year: "numeric" })
                                }
                            </h1>
                        </div>

                        <div className={`flex items-center gap-2 transition-all duration-300 ${isScrolled ? "mt-0" : "mt-1"}`}>
                            <div className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-full text-xs font-bold text-gray-600">
                                <Clock size={14} className="text-indigo-500" />
                                {isScrolled ? time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : time.toLocaleTimeString("en-US")}
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN DERECHA: Botones de Acción */}
                    <div className={`
                        flex items-center transition-all duration-300
                        ${isScrolled
                            ? "fixed bottom-4 right-4 flex-col lg:static lg:flex-row lg:bottom-auto lg:right-auto gap-3"
                            : "flex-col md:flex-row gap-3 w-full lg:w-auto"
                        }
                    `}>
                        {/* Disponibilidad */}
                        <div className={`transition-all duration-300 ${isScrolled ? "w-12 h-12 rounded-full shadow-xl overflow-hidden" : "w-full lg:w-auto"}`}>
                            <AvailabilityPopover />
                        </div>

                        {/* Botón Excepciones */}
                        <button
                            onClick={() => setExceptionOpen(true)}
                            className={`
                                flex items-center justify-center gap-2 rounded-xl font-bold transition-all active:scale-95
                                ${isScrolled
                                    ? "w-12 h-12 bg-white border border-gray-200 shadow-xl text-purple-500"
                                    : "w-full lg:w-auto px-5 py-3 bg-white border border-gray-200 text-gray-700 text-sm shadow-sm hover:bg-gray-50"
                                }
                            `}
                            title="Exceptions"
                        >
                            <AlertCircle size={24} className={isScrolled ? "" : "text-purple-500"} />
                            {!isScrolled && <span className="whitespace-nowrap">Exceptions</span>}
                        </button>

                        {/* Botón Servicios */}
                        <button
                            onClick={() => router.push("/dashboard/barber/catalog")}
                            className={`
                                flex items-center justify-center gap-2 rounded-xl font-bold transition-all active:scale-95
                                ${isScrolled
                                    ? "w-12 h-12 bg-indigo-600 text-white shadow-xl"
                                    : "w-full lg:w-auto px-5 py-3 bg-indigo-600 text-white text-sm shadow-lg hover:bg-indigo-700"
                                }
                            `}
                            title="Services"
                        >
                            <Scissors size={24} />
                            {!isScrolled && <span className="whitespace-nowrap">Services</span>}
                        </button>
                    </div>
                </div>
            </header>

            <ExceptionModal
                open={exceptionOpen}
                onClose={() => setExceptionOpen(false)}
                onSuccess={onExceptionAdded}
            />
        </>
    );
}
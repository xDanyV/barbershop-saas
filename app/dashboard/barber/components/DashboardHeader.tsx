"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AvailabilityPopover from "./AvailabilityPopover";
import ExceptionModal from "./ExceptionModal";
import { Clock, Calendar as CalendarIcon, Scissors, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

type Props = {
    onExceptionAdded: () => void;
};

export default function DashboardHeader({ onExceptionAdded }: Props) {
    const router = useRouter();
    const [time, setTime] = useState<Date | null>(null);
    const [exceptionOpen, setExceptionOpen] = useState(false);

    useEffect(() => {
        const update = () => setTime(new Date());
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, []);

    if (!time) return null;

    const date = time.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });

    const hour = time.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });

    return (
        <>
            <header className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 md:mb-12 gap-6">
                <div className="space-y-1">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2 text-indigo-600 font-bold tracking-tight mb-1"
                    >
                        <CalendarIcon size={18} />
                        <span className="uppercase text-[10px] md:text-xs tracking-widest">Barber Management</span>
                    </motion.div>

                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
                        {date}
                    </h1>

                    <div className="flex flex-wrap items-center gap-3 text-gray-500">
                        <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-full text-xs md:text-sm font-medium">
                            <Clock size={14} className="text-indigo-500" />
                            {hour}
                        </div>
                        <p className="text-xs md:text-sm">Manage your daily schedule</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    <div className="flex-1 min-w-35 md:flex-none">
                        <AvailabilityPopover />
                    </div>

                    <button
                        onClick={() => setExceptionOpen(true)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-bold shadow-sm hover:bg-gray-50 transition-all active:scale-95"
                    >
                        <AlertCircle size={18} className="text-purple-500 shrink-0" />
                        <span>Exceptions</span>
                    </button>

                    <button
                        onClick={() => router.push("/dashboard/barber/catalog")}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                    >
                        <Scissors size={18} className="shrink-0" />
                        <span>Services</span>
                    </button>
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
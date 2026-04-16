"use client";

import { useEffect, useState, Fragment } from "react";
import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from "@headlessui/react";
import { toast } from "react-hot-toast";
import { X, Calendar, Coffee } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const days = [
    { label: "Mon", value: 1 }, { label: "Tue", value: 2 },
    { label: "Wed", value: 3 }, { label: "Thu", value: 4 },
    { label: "Fri", value: 5 }, { label: "Sat", value: 6 },
    { label: "Sun", value: 0 },
];

export default function AvailabilityModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDays, setSelectedDays] = useState<number[]>([]);
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");

    // Estados para el Lunch/Break
    const [hasBreak, setHasBreak] = useState(false);
    const [breakStart, setBreakStart] = useState("");
    const [breakEnd, setBreakEnd] = useState("");

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        async function fetchAvailability() {
            try {
                const res = await fetch("/api/protected/availability");
                const data = await res.json();
                if (!data?.length) return;

                setSelectedDays(data.map((d: any) => d.dayOfWeek));
                setStartTime(data[0].startTime);
                setEndTime(data[0].endTime);

                // Cargar datos de break si existen
                if (data[0].breakStart && data[0].breakEnd) {
                    setHasBreak(true);
                    setBreakStart(data[0].breakStart);
                    setBreakEnd(data[0].breakEnd);
                } else {
                    setHasBreak(false);
                    setBreakStart("");
                    setBreakEnd("");
                }
            } catch (error) {
                console.error("Error loading availability", error);
            }
        }
        fetchAvailability();
    }, [isOpen]);

    const toggleDay = (day: number) => {
        setSelectedDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const handleSave = async () => {
        setLoading(true);
        const res = await fetch("/api/protected/availability", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                days: selectedDays,
                startTime,
                endTime,
                // Si hasBreak es false, enviamos null
                breakStart: hasBreak ? breakStart : null,
                breakEnd: hasBreak ? breakEnd : null
            }),
        });
        setLoading(false);

        if (!res.ok) return toast.error("Error al guardar");

        toast.success("Horario actualizado");
        setIsOpen(false);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
            >
                <Calendar size={18} />
                Availability Schedule
            </button>

            <Transition show={isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => !loading && setIsOpen(false)}>
                    <TransitionChild
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
                    </TransitionChild>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <TransitionChild
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white p-7 shadow-2xl transition-all">
                                    <div className="flex items-center justify-between mb-6">
                                        <DialogTitle as="h3" className="text-xl font-bold text-gray-900">
                                            Working Hours
                                        </DialogTitle>
                                        <button
                                            onClick={() => setIsOpen(false)}
                                            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Selector de Días */}
                                        <div>
                                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">
                                                Active Days
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {days.map((day) => {
                                                    const active = selectedDays.includes(day.value);
                                                    return (
                                                        <button
                                                            key={day.value}
                                                            onClick={() => toggleDay(day.value)}
                                                            className={`h-10 w-10 rounded-xl text-xs font-bold transition-all border ${active
                                                                ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200"
                                                                : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                                                                }`}
                                                        >
                                                            {day.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Turno Principal */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block ml-1">Start</label>
                                                <input
                                                    type="time"
                                                    value={startTime}
                                                    onChange={(e) => setStartTime(e.target.value)}
                                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block ml-1">End</label>
                                                <input
                                                    type="time"
                                                    value={endTime}
                                                    onChange={(e) => setEndTime(e.target.value)}
                                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                                />
                                            </div>
                                        </div>

                                        {/* Sección de Lunch/Break */}
                                        <div className="pt-4 border-t border-gray-50">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                                                        <Coffee size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900">Lunch Break</p>
                                                        <p className="text-[10px] text-gray-400 font-medium">Add a break to your shift</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setHasBreak(!hasBreak)}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${hasBreak ? 'bg-indigo-600' : 'bg-gray-200'}`}
                                                >
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hasBreak ? 'translate-x-6' : 'translate-x-1'}`} />
                                                </button>
                                            </div>

                                            <AnimatePresence>
                                                {hasBreak && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="grid grid-cols-2 gap-4 pb-2">
                                                            <div className="space-y-1.5">
                                                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block ml-1">Break Start</label>
                                                                <input
                                                                    type="time"
                                                                    value={breakStart}
                                                                    onChange={(e) => setBreakStart(e.target.value)}
                                                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                                                />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block ml-1">Break End</label>
                                                                <input
                                                                    type="time"
                                                                    value={breakEnd}
                                                                    onChange={(e) => setBreakEnd(e.target.value)}
                                                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                                                />
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    <div className="mt-8 flex gap-3">
                                        <button
                                            onClick={() => setIsOpen(false)}
                                            className="flex-1 py-3 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={loading}
                                            className="flex-1 py-3 bg-indigo-600 text-white text-sm font-bold rounded-2xl hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-100 transition-all"
                                        >
                                            {loading ? "Saving..." : "Save Changes"}
                                        </button>
                                    </div>
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>
    );
}
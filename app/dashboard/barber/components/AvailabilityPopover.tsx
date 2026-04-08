"use client";

import { useEffect, useState, Fragment } from "react";
import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from "@headlessui/react";
import { toast } from "react-hot-toast";
import { X, Calendar } from "lucide-react";

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
            body: JSON.stringify({ days: selectedDays, startTime, endTime }),
        });
        setLoading(false);

        if (!res.ok) return toast.error("Error al guardar");

        toast.success("Horario actualizado");
        setIsOpen(false);
    };

    return (
        <>
            {/* Botón disparador */}
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
            >
                <Calendar size={18} />
                Availability Schedule
            </button>

            <Transition show={isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => !loading && setIsOpen(false)}>

                    {/* Backdrop (Fondo oscuro) */}
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

                                        {/* Inputs de Tiempo */}
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
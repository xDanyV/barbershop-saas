"use client";

import { useEffect, useState, Fragment } from "react";
import { useRouter } from "next/navigation";
import { Popover, PopoverButton, PopoverPanel, Dialog, Transition } from "@headlessui/react";
import { toast } from "react-hot-toast";
import { X } from "lucide-react";

export default function DashboardHeader() {

    const router = useRouter();
    const [time, setTime] = useState<Date | null>(null);
    const [selectedDays, setSelectedDays] = useState<number[]>([]);
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");

    // Exception modal state
    const [exceptionOpen, setExceptionOpen] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [reason, setReason] = useState("");
    const [savingException, setSavingException] = useState(false);

    const days = [
        { label: "Monday", value: 1 },
        { label: "Tuesday", value: 2 },
        { label: "Wednesday", value: 3 },
        { label: "Thursday", value: 4 },
        { label: "Friday", value: 5 },
        { label: "Saturday", value: 6 },
        { label: "Sunday", value: 0 },
    ];

    useEffect(() => {
        const update = () => setTime(new Date());
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        async function fetchAvailability() {
            try {
                const res = await fetch("/api/protected/availability");
                const data = await res.json();
                if (!data.length) return;
                const days = data.map((d: any) => d.dayOfWeek);
                setSelectedDays(days);
                setStartTime(data[0].startTime);
                setEndTime(data[0].endTime);
            } catch (error) {
                console.error("Failed to load availability", error);
            }
        }
        fetchAvailability();
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

    function toggleDay(day: number) {
        setSelectedDays((prev) =>
            prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
        );
    }

    async function handleSaveSchedule(close: () => void) {
        const res = await fetch("/api/protected/availability", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ days: selectedDays, startTime, endTime }),
        });

        if (!res.ok) {
            toast.error("Failed to save schedule");
            return;
        }

        toast.success("Schedule saved");
        close();
    }

    async function handleSaveException() {
        if (!startDate || !endDate) {
            toast.error("Please select start and end dates");
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            toast.error("Start date cannot be after end date");
            return;
        }

        setSavingException(true);
        try {
            const res = await fetch("/api/protected/exceptions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ startDate, endDate, reason }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error ?? "Failed to save exception");
                return;
            }

            toast.success("Exception saved — affected appointments have been cancelled");
            setExceptionOpen(false);
            setStartDate("");
            setEndDate("");
            setReason("");

        } catch {
            toast.error("Network error, please try again");
        } finally {
            setSavingException(false);
        }
    }

    return (
        <>
            <header className="flex items-start justify-between mb-10">

                <div className="space-y-2">
                    <h1 className="text-4xl font-bold text-gray-800">{date}</h1>
                    <p className="text-xl text-gray-500">{hour}</p>
                    <p className="text-xl text-gray-500">Select a day to view appointments</p>
                </div>

                <div className="flex gap-4">

                    {/* Availability Schedule Popover */}
                    <Popover className="relative">
                        <PopoverButton className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium shadow-sm hover:bg-indigo-900 transition cursor-pointer">
                            Availability Schedule
                        </PopoverButton>

                        <PopoverPanel className="absolute right-0 mt-3 w-80 bg-white border border-gray-200 rounded-xl shadow-lg p-4 space-y-4 z-50">
                            {({ close }) => (
                                <div className="space-y-4">
                                    <p className="text-lg font-medium text-center text-gray-700">
                                        Working Days
                                    </p>

                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        {days.map((day) => (
                                            <label key={day.value} className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedDays.includes(day.value)}
                                                    onChange={() => toggleDay(day.value)}
                                                />
                                                {day.label}
                                            </label>
                                        ))}
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-gray-700">Working Hours</p>
                                        <div className="flex gap-2">
                                            <input
                                                type="time"
                                                value={startTime}
                                                onChange={(e) => setStartTime(e.target.value)}
                                                className="border rounded-lg px-2 py-1 text-sm w-full"
                                            />
                                            <input
                                                type="time"
                                                value={endTime}
                                                onChange={(e) => setEndTime(e.target.value)}
                                                className="border rounded-lg px-2 py-1 text-sm w-full"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleSaveSchedule(close)}
                                        className="w-full bg-indigo-600 text-white text-sm py-2 rounded-lg hover:bg-indigo-700 transition cursor-pointer"
                                    >
                                        Save Schedule
                                    </button>
                                </div>
                            )}
                        </PopoverPanel>
                    </Popover>

                    {/* Exception button */}
                    <button
                        onClick={() => setExceptionOpen(true)}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium shadow-sm hover:bg-indigo-900 transition cursor-pointer"
                    >
                        Exception
                    </button>

                    {/* Services button */}
                    <button
                        onClick={() => router.push("/dashboard/barber/catalog")}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium shadow-sm hover:bg-indigo-900 transition cursor-pointer"
                    >
                        Services
                    </button>

                </div>
            </header>

            {/* ── Exception Modal ── */}
            <Transition appear show={exceptionOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => !savingException && setExceptionOpen(false)}>

                    {/* Fondo borroso */}
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-200"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-150"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                    </Transition.Child>

                    {/* Panel centrado */}
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-200"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-150"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">

                                {/* Header */}
                                <div className="flex items-center justify-between mb-5">
                                    <Dialog.Title className="text-lg font-semibold text-gray-800">
                                        Add Exception
                                    </Dialog.Title>
                                    <button
                                        onClick={() => setExceptionOpen(false)}
                                        disabled={savingException}
                                        className="text-gray-400 hover:text-gray-600 transition cursor-pointer disabled:opacity-40"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <p className="text-sm text-gray-500 mb-5">
                                    Select a date range to block. All pending and confirmed appointments within this range will be automatically cancelled.
                                </p>

                                <div className="space-y-4">

                                    {/* Date range */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 mb-1 block">
                                                Start date
                                            </label>
                                            <input
                                                type="date"
                                                value={startDate}
                                                min={new Date().toISOString().split("T")[0]}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 mb-1 block">
                                                End date
                                            </label>
                                            <input
                                                type="date"
                                                value={endDate}
                                                min={startDate || new Date().toISOString().split("T")[0]}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                            />
                                        </div>
                                    </div>

                                    {/* Reason */}
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 mb-1 block">
                                            Reason (optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            placeholder="e.g. Vacation, Emergency..."
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                        />
                                    </div>

                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => setExceptionOpen(false)}
                                        disabled={savingException}
                                        className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer disabled:opacity-40"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveException}
                                        disabled={savingException || !startDate || !endDate}
                                        className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                                    >
                                        {savingException ? (
                                            <>
                                                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            "Apply Exception"
                                        )}
                                    </button>
                                </div>

                            </Dialog.Panel>
                        </Transition.Child>
                    </div>

                </Dialog>
            </Transition>
        </>
    );
}
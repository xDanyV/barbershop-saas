"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { toast } from "react-hot-toast";

export default function DashboardHeader() {

    const router = useRouter();
    const [time, setTime] = useState<Date | null>(null);
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const [selectedDays, setSelectedDays] = useState<number[]>([]);
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
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

        update(); // set first value

        const interval = setInterval(update, 1000);

        return () => clearInterval(interval);

    }, []);

    useEffect(() => {
        if (!open) return;

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
        year: "numeric"
    });

    const hour = time.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });

    function toggleDay(day: number) {
        setSelectedDays((prev) =>
            prev.includes(day)
                ? prev.filter((d) => d !== day)
                : [...prev, day]
        );
    }

    async function handleSaveSchedule(close: () => void) {
        const res = await fetch("/api/protected/availability", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                days: selectedDays,
                startTime,
                endTime,
            }),
        });

        if (!res.ok) {
            toast.error("Failed to save schedule");
            return;
        }

        toast.success("Schedule saved");
        close(); // cierra el popover
    }

    return (
        <header className="flex items-start justify-between mb-10">

            <div className="space-y-2">
                <h1 className="text-4xl font-bold text-gray-800">
                    {date}
                </h1>

                <p className="text-xl text-gray-500">
                    {hour}
                </p>

                <p className="text-xl text-gray-500">
                    Select a day to view appointments
                </p>
            </div>

            <div className="flex gap-4">

                <Popover className="relative">

                    <PopoverButton className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium shadow-sm hover:bg-indigo-900 transition cursor-pointer">
                        Availability Schedule
                    </PopoverButton>

                    <PopoverPanel className="absolute right-0 mt-3 w-80 bg-white border border-gray-200 rounded-xl shadow-lg p-4 space-y-4">
                        {({ close }) => {
                            return (
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

                                    {/* Working hours */}
                                    <div className="space-y-2">

                                        <p className="text-sm font-medium text-gray-700">
                                            Working Hours
                                        </p>

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

                                    {/* Save button */}
                                    <button
                                        onClick={() => handleSaveSchedule(close)}
                                        className="w-full bg-indigo-600 text-white text-sm py-2 rounded-lg hover:bg-indigo-700 transition"
                                    >
                                        Save Schedule
                                    </button>
                                </div>
                            );

                        }}
                    </PopoverPanel>

                </Popover>

                <button className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium shadow-sm hover:bg-indigo-900 transition cursor-pointer">
                    Exception
                </button>

                <button
                    onClick={() => router.push("/dashboard/barber/catalog")}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium shadow-sm hover:bg-indigo-900 transition cursor-pointer">
                    Services
                </button>

            </div>

        </header>
    );
}
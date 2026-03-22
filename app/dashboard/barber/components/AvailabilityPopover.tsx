"use client";

import { useEffect, useState } from "react";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { toast } from "react-hot-toast";

const days = [
    { label: "Monday", value: 1 },
    { label: "Tuesday", value: 2 },
    { label: "Wednesday", value: 3 },
    { label: "Thursday", value: 4 },
    { label: "Friday", value: 5 },
    { label: "Saturday", value: 6 },
    { label: "Sunday", value: 0 },
];

export default function AvailabilityPopover() {
    const [selectedDays, setSelectedDays] = useState<number[]>([]);
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");

    useEffect(() => {
        async function fetchAvailability() {
            try {
                const res = await fetch("/api/protected/availability");
                const data = await res.json();
                if (!data.length) return;
                setSelectedDays(data.map((d: any) => d.dayOfWeek));
                setStartTime(data[0].startTime);
                setEndTime(data[0].endTime);
            } catch (error) {
                console.error("Failed to load availability", error);
            }
        }
        fetchAvailability();
    }, []);

    const toggleDay = (day: number) => {
        setSelectedDays((prev) =>
            prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
        );
    };

    const handleSave = async (close: () => void) => {
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
    };

    return (
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
                            onClick={() => handleSave(close)}
                            className="w-full bg-indigo-600 text-white text-sm py-2 rounded-lg hover:bg-indigo-700 transition cursor-pointer"
                        >
                            Save Schedule
                        </button>

                    </div>
                )}
            </PopoverPanel>
        </Popover>
    );
}
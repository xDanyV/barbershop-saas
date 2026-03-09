"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardHeader() {

    const router = useRouter();
    const [time, setTime] = useState<Date | null>(null);

    useEffect(() => {

        const update = () => setTime(new Date());

        update(); // set first value

        const interval = setInterval(update, 1000);

        return () => clearInterval(interval);

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

                <button className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium shadow-sm hover:bg-indigo-700 transition">
                    Available Days
                </button>

                <button className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium shadow-sm hover:bg-indigo-700 transition">
                    Schedule
                </button>

                <button
                    onClick={() => router.push("/dashboard/barber/catalog")}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium shadow-sm hover:bg-indigo-700 transition cursor-pointer">
                    Services
                </button>

            </div>

        </header>
    );
}
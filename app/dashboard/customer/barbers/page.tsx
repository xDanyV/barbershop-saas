"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Barber = {
    id: string;
    user: {
        name: string | null;
        email: string;
        phone: string;
    };
};

export default function BarbersPage() {
    const router = useRouter();
    const [barbers, setBarbers] = useState<Barber[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/barbers")
            .then((res) => res.json())
            .then((data: Barber[]) => setBarbers(data))
            .catch(() => console.error("Could not load barbers"))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="p-8 max-w-4xl mx-auto">

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Our Barbers</h1>
                <p className="text-gray-500 mt-1">Choose a barber to book your appointment</p>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6 animate-pulse">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 rounded-full bg-gray-100" />
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                                </div>
                            </div>
                            <div className="h-9 bg-gray-100 rounded-xl" />
                        </div>
                    ))}
                </div>
            ) : barbers.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <p className="text-lg">No barbers available at the moment</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {barbers.map((barber) => {
                        const initials = barber.user.name
                            ? barber.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                            : "B";

                        return (
                            <div
                                key={barber.id}
                                className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all duration-200"
                            >
                                <div className="flex items-center gap-4 mb-5">
                                    <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                        <span className="text-indigo-600 font-semibold text-lg">{initials}</span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">
                                            {barber.user.name ?? "Barber"}
                                        </p>
                                        <p className="text-sm text-gray-400">{barber.user.phone}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => router.push(`/dashboard/customer?barberId=${barber.id}`)}
                                    className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition cursor-pointer"
                                >
                                    Book appointment
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

        </div>
    );
}
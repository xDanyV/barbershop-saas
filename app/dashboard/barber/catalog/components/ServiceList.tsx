"use client";

import { useEffect, useState } from "react";

type Service = {
    id: string;
    name: string;
    price: number;
    duration: number;
};

export default function ServiceList() {

    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchServices() {
            try {
                const res = await fetch("/api/catalog");
                const data = await res.json();

                setServices(data);
            } catch (error) {
                console.error("Failed to fetch services", error);
            } finally {
                setLoading(false);
            }
        }

        fetchServices();
    }, []);

    if (loading) {
        return (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 text-gray-500">
                Loading services...
            </div>
        );
    }

    if (!services.length) {
        return (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 text-gray-500 text-center">
                No services yet. Create your first service to start building your catalog.
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">

            <div className="space-y-4">

                {services.map((service) => (

                    <div
                        key={service.id}
                        className="flex justify-between items-center p-4 rounded-lg border"
                    >

                        <div>

                            <p className="font-medium">{service.name}</p>

                            <p className="text-sm text-gray-500">
                                ${service.price.toFixed(2)} · {service.duration} min
                            </p>

                        </div>

                        <button className="text-indigo-600 text-sm hover:underline">
                            Edit
                        </button>

                    </div>

                ))}

            </div>

        </div>
    );
}
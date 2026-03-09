"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Service } from "@prisma/client";

type Props = {
    onEdit: (service: Service) => void;
};

export default function ServiceList({ onEdit }: Props) {

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

    async function handleDelete(id: string) {
        try {

            const res = await fetch(`/api/protected/catalog/${id}`, {
                method: "DELETE",
                headers: {
                    "x-user-role": "BARBER",
                },
            });

            if (!res.ok) {
                throw new Error("Failed to delete service");
            }

            setServices((prev) => prev.filter((service) => service.id !== id));

            toast.success("Service deleted");

        } catch (error) {
            toast.error("Delete failed");
        }
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

                        <div className="flex gap-4">

                            <button
                                onClick={() => onEdit(service)}
                                className="text-indigo-600 text-sm hover:underline"
                            >
                                Edit
                            </button>

                            <button
                                onClick={() =>
                                    toast(
                                        (t) => (
                                            <div className="flex flex-col gap-2">
                                                <p className="text-sm">Delete this service?</p>

                                                <div className="flex gap-2">

                                                    <button
                                                        onClick={() => {
                                                            handleDelete(service.id);
                                                            toast.dismiss(t.id);
                                                        }}
                                                        className="bg-red-600 text-white px-2 py-1 rounded text-xs"
                                                    >
                                                        Delete
                                                    </button>

                                                    <button
                                                        onClick={() => toast.dismiss(t.id)}
                                                        className="bg-gray-200 px-2 py-1 rounded text-xs"
                                                    >
                                                        Cancel
                                                    </button>

                                                </div>
                                            </div>
                                        ),
                                        {
                                            id: "confirm-delete",
                                        }
                                    )
                                }
                                className="text-red-600 text-sm hover:underline"
                            >
                                Delete
                            </button>

                        </div>

                    </div>

                ))}

            </div>

        </div>
    );
}
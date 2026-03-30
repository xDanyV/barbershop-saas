"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Service } from "@prisma/client";
import { motion } from "framer-motion";
import { Edit2, Trash2, Clock, DollarSign } from "lucide-react";

type Props = {
    onEdit: (service: Service) => void;
};

export default function ServiceList({ onEdit }: Props) {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchServices() {
            try {
                const res = await fetch("/api/protected/catalog");
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
                ))}
            </div>
        );
    }

    if (!services.length) {
        return (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
                <p className="text-gray-500 font-medium">No services yet. Create your first service to start building your catalog.</p>
            </div>
        );
    }

    async function handleDelete(id: string) {
        try {
            const res = await fetch(`/api/protected/catalog/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete service");
            setServices((prev) => prev.filter((s) => s.id !== id));
            toast.success("Service deleted");
        } catch (error) {
            toast.error("Delete failed");
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service, index) => (
                <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-100 transition-all flex justify-between items-center"
                >
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors">
                            {service.name}
                        </h3>
                        <div className="flex gap-4 mt-2">
                            <span className="flex items-center gap-1 text-sm font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">
                                <DollarSign size={14} />
                                {service.price.toFixed(2)}
                            </span>
                            <span className="flex items-center gap-1 text-sm text-gray-500">
                                <Clock size={14} />
                                {service.duration} min
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => onEdit(service)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Edit"
                        >
                            <Edit2 size={18} />
                        </button>
                        <button
                            onClick={() => {
                                toast((t) => (
                                    <div className="flex flex-col gap-3 p-1">
                                        <p className="text-sm font-medium">Delete "{service.name}"?</p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => { handleDelete(service.id); toast.dismiss(t.id); }}
                                                className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
                                            >
                                                Confirm
                                            </button>
                                            <button
                                                onClick={() => toast.dismiss(t.id)}
                                                className="bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-bold"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ));
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
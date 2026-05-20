"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Service } from "@prisma/client";
import { motion } from "framer-motion";
import { Edit2, Trash2, Clock, DollarSign } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = {
    onEdit: (service: Service) => void;
};

export default function ServiceList({ onEdit }: Props) {
    const t = useTranslations("ServiceList");
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
                <p className="text-gray-500 font-medium">{t("empty")}</p>
            </div>
        );
    }

    async function handleDelete(id: string) {
        try {
            const res = await fetch(`/api/protected/catalog/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            setServices((prev) => prev.filter((s) => s.id !== id));
            toast.success(t("success.deleted"));
        } catch {
            toast.error(t("errors.deleteFailed"));
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {services.map((service, index) => (
                <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group bg-white border border-gray-100 p-4 md:p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-100 transition-all flex justify-between items-center gap-4"
                >
                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-gray-900 text-base md:text-lg group-hover:text-indigo-600 transition-colors truncate">
                            {service.name}
                        </h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
                            <span className="flex items-center gap-1 text-xs md:text-sm font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">
                                <DollarSign size={14} />
                                {service.price.toFixed(2)}
                            </span>
                            <span className="flex items-center gap-1 text-xs md:text-sm text-gray-400 font-medium">
                                <Clock size={14} />
                                {t("duration", { duration: service.duration })}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-1 md:gap-2 shrink-0">
                        <button
                            onClick={() => onEdit(service)}
                            className="p-2.5 md:p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl md:rounded-lg transition-all active:scale-90"
                            title={t("buttons.edit")}
                        >
                            <Edit2 size={18} />
                        </button>
                        <button
                            onClick={() => {
                                toast((toastInstance) => (
                                    <div className="flex flex-col gap-3 p-1 min-w-50">
                                        <p className="text-sm font-semibold text-gray-800">
                                            {t("deleteConfirm", { name: service.name })}
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => { handleDelete(service.id); toast.dismiss(toastInstance.id); }}
                                                className="flex-1 bg-red-500 text-white px-3 py-2 rounded-lg text-xs font-bold active:bg-red-600"
                                            >
                                                {t("buttons.confirm")}
                                            </button>
                                            <button
                                                onClick={() => toast.dismiss(toastInstance.id)}
                                                className="flex-1 bg-gray-100 text-gray-600 px-3 py-2 rounded-lg text-xs font-bold active:bg-gray-200"
                                            >
                                                {t("buttons.cancel")}
                                            </button>
                                        </div>
                                    </div>
                                ), { duration: 4000, position: "bottom-center" });
                            }}
                            className="p-2.5 md:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl md:rounded-lg transition-all active:scale-90"
                            title={t("buttons.delete")}
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
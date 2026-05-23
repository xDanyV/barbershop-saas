"use client";

import { useEffect, useState } from "react";
import { Check, X, User, Mail, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

export default function PendingBarbersList() {
    const t = useTranslations("PendingBarbersList");
    const [barbers, setBarbers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPending = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/barbers");

            if (!res.ok) {
                setError(`${t("errors.fetchPrefix")} ${res.status}: ${res.statusText}`);
                setBarbers([]);
                return;
            }

            const data = await res.json();
            if (!Array.isArray(data)) {
                setBarbers([]);
                setError(t("errors.format"));
            } else {
                setBarbers(data);
                setError(null);
            }
        } catch (err) {
            console.error("Fetch error:", err);
            setError(t("errors.connection"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const handleAction = async (barberId: string, status: string) => {
        try {
            const res = await fetch("/api/admin/barbers", {
                method: "PATCH",
                body: JSON.stringify({ barberId, status }),
            });
            if (res.ok) fetchPending();
        } catch (err) {
            console.error("Action error:", err);
        }
    };

    if (loading) return <div className="p-10 text-center font-bold text-gray-400">{t("loadingDir")}</div>;

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl font-bold mx-4 md:mx-0">
                    Error: {error}
                </div>
            )}

            {/* Contenedor con altura máxima y scroll interno. Incluye el pb-24 para el navbar */}
            <div className="max-h-150 md:max-h-175 overflow-y-auto pr-1 pb-24 md:pb-0 custom-scrollbar">
                <div className="grid gap-4">
                    <AnimatePresence mode="popLayout">
                        {Array.isArray(barbers) && barbers.length === 0 ? (
                            <p className="text-center py-10 text-gray-400 font-bold italic">{t("empty")}</p>
                        ) : (
                            Array.isArray(barbers) && barbers.map((barber: any) => (
                                <motion.div
                                    key={barber.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    className="bg-white border border-gray-100 p-5 md:p-6 rounded-4xl shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-6 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="shrink-0 w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                            <User size={24} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-black text-gray-900 truncate">
                                                {barber.user?.name || t("barber.noName")}
                                            </h3>
                                            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-x-4 gap-y-1 mt-1">
                                                <span className="text-xs text-gray-400 flex items-center gap-1 truncate">
                                                    <Mail size={12} className="shrink-0" />
                                                    <span className="truncate">{barber.user?.email}</span>
                                                </span>
                                                <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                                                    <Phone size={12} className="shrink-0" />
                                                    {barber.user?.phone}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contenedor de acciones: se expande en móvil con línea divisoria */}
                                    <div className="flex items-center gap-2 w-full lg:w-auto mt-2 lg:mt-0 pt-4 lg:pt-0 border-t border-gray-100 lg:border-none">
                                        <button
                                            onClick={() => handleAction(barber.id, "APPROVED")}
                                            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-3 md:py-2.5 bg-green-50 text-green-600 rounded-xl font-bold text-sm hover:bg-green-100 transition-colors"
                                        >
                                            <Check size={18} /> {t("actions.approve")}
                                        </button>
                                        <button
                                            onClick={() => handleAction(barber.id, "REJECTED")}
                                            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-3 md:py-2.5 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors"
                                        >
                                            <X size={18} /> {t("actions.reject")}
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
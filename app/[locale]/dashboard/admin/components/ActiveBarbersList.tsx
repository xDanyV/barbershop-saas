"use client";

import { useEffect, useState } from "react";
import { Mail, Phone, ShieldCheck, Ban } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { useTranslations } from "next-intl";

export default function ActiveBarbersList() {
    const t = useTranslations("ActiveBarbersList");
    const [barbers, setBarbers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchManaged = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/barbers/active");

            if (!res.ok) {
                toast.error(`${t("errors.fetch")}: ${res.statusText}`);
                setBarbers([]);
                return;
            }

            const data = await res.json();
            if (!Array.isArray(data)) {
                setBarbers([]);
                toast.error(t("errors.format"));
            } else {
                setBarbers(data);
            }
        } catch (err) {
            console.error("Fetch error:", err);
            toast.error(t("errors.connection"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchManaged();
    }, []);

    const executeStatusChange = async (barberId: string, newStatus: string, statusLabel: string) => {
        const loadingToast = toast.loading(t("toasts.updating"));

        try {
            const res = await fetch("/api/admin/barbers", {
                method: "PATCH",
                body: JSON.stringify({ barberId, status: newStatus }),
            });

            if (res.ok) {
                toast.success(t("toasts.updatedTo", { status: statusLabel }), { id: loadingToast });
                fetchManaged();
            } else {
                toast.error(t("errors.update"), { id: loadingToast });
                fetchManaged();
            }
        } catch (err) {
            console.error("Action error:", err);
            toast.error(t("errors.connection"), { id: loadingToast });
            fetchManaged();
        }
    };

    const handleStatusChange = (barberId: string, newStatus: string) => {
        const statusLabels: Record<string, string> = {
            PENDING: t("statusLabels.PENDING"),
            APPROVED: t("statusLabels.APPROVED"),
            REJECTED: t("statusLabels.REJECTED")
        };

        const targetLabel = statusLabels[newStatus];

        toast((toastObj) => (
            <div className="flex flex-col gap-3">
                <p className="text-sm font-medium text-gray-900">
                    {t("confirmModal.question")} <span className="font-bold text-indigo-600">{targetLabel}</span>?
                </p>
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={() => {
                            toast.dismiss(toastObj.id);
                            fetchManaged();
                        }}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        {t("confirmModal.cancel")}
                    </button>
                    <button
                        onClick={() => {
                            toast.dismiss(toastObj.id);
                            executeStatusChange(barberId, newStatus, targetLabel);
                        }}
                        className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        {t("confirmModal.confirm")}
                    </button>
                </div>
            </div>
        ), {
            duration: 8000,
            id: `confirm-${barberId}`
        });
    };

    if (loading) return <div className="p-10 text-center font-bold text-gray-400">{t("loadingDir")}</div>;

    return (
        <div className="space-y-6">
            {/* Contenedor con altura máxima y scroll interno para móviles y escritorio */}
            <div className="max-h-150 md:max-h-175 overflow-y-auto pr-1 custom-scrollbar">
                <div className="grid gap-4 pb-24 md:pb-0">
                    <AnimatePresence mode="popLayout">
                        {Array.isArray(barbers) && barbers.length === 0 ? (
                            <p className="text-center py-10 text-gray-400 font-bold italic">{t("empty")}</p>
                        ) : (
                            Array.isArray(barbers) && barbers.map((barber: any) => {
                                const isApproved = barber.status === "APPROVED";

                                return (
                                    <motion.div
                                        key={barber.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className={`bg-white border p-5 md:p-6 rounded-4xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 transition-colors ${isApproved ? "border-gray-100" : "border-red-100 bg-red-50/30"
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${isApproved ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                                                }`}>
                                                {isApproved ? <ShieldCheck size={24} /> : <Ban size={24} />}
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

                                        <div className="flex items-center w-full md:w-auto mt-2 md:mt-0 pt-4 md:pt-0 border-t border-gray-100 md:border-0">
                                            {barber.isSelf ? (
                                                <span className="w-full md:w-auto text-center px-4 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm border border-indigo-100">
                                                    {t("barber.yourAccount")}
                                                </span>
                                            ) : (
                                                <select
                                                    value={barber.status}
                                                    onChange={(e) => handleStatusChange(barber.id, e.target.value)}
                                                    // Ajustado w-full en móvil para mejor usabilidad táctil
                                                    className={`w-full md:w-auto px-4 py-3 md:py-2.5 bg-white border rounded-xl font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer transition-colors ${isApproved ? "border-gray-200 text-gray-700" : "border-red-200 text-red-600"
                                                        }`}
                                                >
                                                    <option value="APPROVED">{t("options.APPROVED")}</option>
                                                    <option value="PENDING">{t("options.PENDING")}</option>
                                                    <option value="REJECTED">{t("options.REJECTED")}</option>
                                                </select>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
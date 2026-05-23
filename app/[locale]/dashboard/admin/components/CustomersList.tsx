"use client";

import { useEffect, useState } from "react";
import { Search, User, Mail, Phone, CalendarDays, Ban, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { useTranslations } from "next-intl";

export default function CustomersList() {
    const t = useTranslations("CustomersList");
    const [customers, setCustomers] = useState<any[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/customers");

            if (!res.ok) {
                toast.error(t("errors.fetch"));
                return;
            }

            const data = await res.json();
            if (Array.isArray(data)) {
                setCustomers(data);
                setFilteredCustomers(data);
            }
        } catch (err) {
            console.error("Fetch error:", err);
            toast.error(t("errors.connection"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredCustomers(customers);
            return;
        }

        const lowerCaseTerm = searchTerm.toLowerCase();
        const filtered = customers.filter(c =>
            (c.name && c.name.toLowerCase().includes(lowerCaseTerm)) ||
            (c.email && c.email.toLowerCase().includes(lowerCaseTerm)) ||
            (c.phone && c.phone.includes(lowerCaseTerm))
        );
        setFilteredCustomers(filtered);
    }, [searchTerm, customers]);

    // Lógica para bloquear/desbloquear
    const executeBanToggle = async (customerId: string, willBan: boolean) => {
        const loadingToast = toast.loading(willBan ? t("toasts.blocking") : t("toasts.unblocking"));

        try {
            const res = await fetch("/api/admin/customers", {
                method: "PATCH",
                body: JSON.stringify({ customerId, isBanned: willBan }),
            });

            if (res.ok) {
                toast.success(willBan ? t("toasts.blocked") : t("toasts.unblocked"), { id: loadingToast });
                fetchCustomers();
            } else {
                toast.error(t("errors.update"), { id: loadingToast });
            }
        } catch (err) {
            console.error("Action error:", err);
            toast.error(t("errors.connection"), { id: loadingToast });
        }
    };

    const handleBanToggle = (customerId: string, isCurrentlyBanned: boolean) => {
        const actionText = isCurrentlyBanned ? t("confirmModal.actionUnblock") : t("confirmModal.actionBlock");
        const willBan = !isCurrentlyBanned;

        toast((toastObj) => (
            <div className="flex flex-col gap-3">
                <p className="text-sm font-medium text-gray-900">
                    {t("confirmModal.question")} <span className={`font-bold ${willBan ? "text-red-600" : "text-green-600"}`}>{actionText}</span> {t("confirmModal.thisCustomer")}
                </p>
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={() => toast.dismiss(toastObj.id)}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        {t("confirmModal.cancel")}
                    </button>
                    <button
                        onClick={() => {
                            toast.dismiss(toastObj.id);
                            executeBanToggle(customerId, willBan);
                        }}
                        className={`px-3 py-1.5 text-white text-xs font-bold rounded-lg transition-colors shadow-sm ${willBan ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                            }`}
                    >
                        {t("confirmModal.confirm")}
                    </button>
                </div>
            </div>
        ), { duration: 8000, id: `ban-confirm-${customerId}` });
    };

    if (loading) return <div className="p-10 text-center font-bold text-gray-400">{t("loadingDir")}</div>;

    return (
        <div className="space-y-6">
            {/* Barra de búsqueda (Siempre visible arriba del scroll) */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <Search size={20} />
                </div>
                <input
                    type="text"
                    placeholder={t("searchPlaceholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                />
            </div>

            {/* Contenedor con altura máxima y scroll interno. Incluye el pb-24 para que el navbar no estorbe */}
            <div className="max-h-150 md:max-h-175 overflow-y-auto pr-1 pb-24 md:pb-0 custom-scrollbar">
                <div className="grid gap-4">
                    <AnimatePresence mode="popLayout">
                        {filteredCustomers.length === 0 ? (
                            <p className="text-center py-10 text-gray-400 font-bold italic">{t("empty")}</p>
                        ) : (
                            filteredCustomers.map((customer: any) => (
                                <motion.div
                                    key={customer.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className={`border p-5 md:p-6 rounded-4xl shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-6 hover:shadow-md transition-all ${customer.isBanned ? "bg-red-50/40 border-red-100" : "bg-white border-gray-100"
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${customer.isBanned ? "bg-red-100 text-red-500" : "bg-blue-50 text-blue-500"
                                            }`}>
                                            <User size={24} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-black text-gray-900 flex flex-wrap items-center gap-2">
                                                <span className="truncate max-w-37.5 sm:max-w-xs">{customer.name || t("customer.noName")}</span>
                                                {customer.isBanned && (
                                                    <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase tracking-widest shrink-0">
                                                        {t("customer.bannedBadge")}
                                                    </span>
                                                )}
                                            </h3>
                                            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-x-4 gap-y-1 mt-1">
                                                <span className="text-xs text-gray-400 flex items-center gap-1 truncate">
                                                    <Mail size={12} className="shrink-0" />
                                                    <span className="truncate">{customer.email}</span>
                                                </span>
                                                <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                                                    <Phone size={12} className="shrink-0" />
                                                    {customer.phone}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contenedor de acciones: se adapta a móvil extendiéndose y poniendo borde */}
                                    <div className="flex items-center gap-3 w-full lg:w-auto mt-2 lg:mt-0 pt-4 lg:pt-0 border-t border-gray-100 lg:border-none">
                                        {/* Métrica de Citas */}
                                        <div className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100 shrink-0">
                                            <CalendarDays size={18} className="text-indigo-500" />
                                            <div className="flex flex-col">
                                                <span className="text-base font-black leading-none">{customer._count?.appointments || 0}</span>
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t("customer.appointments")}</span>
                                            </div>
                                        </div>

                                        {/* Botón de Acción (Ocupa el resto del espacio en móvil) */}
                                        <button
                                            onClick={() => handleBanToggle(customer.id, customer.isBanned)}
                                            className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors ${customer.isBanned
                                                ? "bg-green-50 text-green-600 hover:bg-green-100 border border-green-100"
                                                : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-50"
                                                }`}
                                        >
                                            {customer.isBanned ? (
                                                <><CheckCircle2 size={18} /> {t("actions.allow")}</>
                                            ) : (
                                                <><Ban size={18} /> {t("actions.block")}</>
                                            )}
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
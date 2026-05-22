"use client";

import { useState } from "react";
import { UserPlus, Users, Settings, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

import PendingBarbersList from "./components/PendingBarbersList";
import ActiveBarbersList from "./components/ActiveBarbersList";
import CustomersList from "./components/CustomersList";
import SystemSettings from "./components/SystemSettings";

// Definimos las pestañas solo con sus identificadores e iconos
const TABS = [
    { id: "pending", icon: UserPlus },
    { id: "barbers", icon: Users },
    { id: "customers", icon: ShieldAlert },
    { id: "settings", icon: Settings },
];

export default function AdminDashboard() {
    const t = useTranslations("AdminDashboard");
    const [activeTab, setActiveTab] = useState("pending");

    return (
        <div className="space-y-6 md:space-y-8 px-4 py-6 md:p-8 max-w-6xl mx-auto">
            {/* Header del Dashboard */}
            <div>
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                    {t("title")}
                </h1>
                <p className="text-sm md:text-base text-gray-500 font-medium mt-1">
                    {t("subtitle")}
                </p>
            </div>

            {/* Contenedor de Pestañas (Scroll horizontal oculto en móviles) */}
            <div className="relative border-b border-gray-100">
                <div className="flex overflow-x-auto gap-2 pb-1 custom-scrollbar">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative flex items-center gap-2 px-4 md:px-5 py-3 font-bold text-sm transition-colors whitespace-nowrap rounded-t-xl hover:bg-gray-50/50 ${isActive ? "text-indigo-600" : "text-gray-400 hover:text-gray-700"
                                    }`}
                            >
                                <Icon size={18} className={isActive ? "text-indigo-600" : "text-gray-400"} />
                                <span>{t(`tabs.${tab.id}`)}</span>

                                {/* Indicador Animado de Pestaña Activa */}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabIndicator"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
                                        initial={false}
                                        transition={{
                                            type: "spring",
                                            stiffness: 500,
                                            damping: 30
                                        }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Renderizado de Componentes con Animación de Cross-fade */}
            <div className="pt-2 md:pt-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === "pending" && <PendingBarbersList />}
                        {activeTab === "barbers" && <ActiveBarbersList />}
                        {activeTab === "customers" && <CustomersList />}
                        {activeTab === "settings" && <SystemSettings />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
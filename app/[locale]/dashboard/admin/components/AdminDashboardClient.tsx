"use client";

import { useState } from "react";
import { UserPlus, Users, Settings, ShieldAlert, CreditCard, Store, History, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

import PendingBarbersList from "./PendingBarbersList";
import ActiveBarbersList from "./ActiveBarbersList";
import CustomersList from "./CustomersList";
import SystemSettings from "./SystemSettings";

import BusinessBillingManager from "./BusinessBillingManager";
import PlatformBusinesses from "./PlatformBusinesses";
import AuditLogList from "./AuditLogList";
import OwnerOverview from "./OwnerOverview";


// Definimos las pestañas solo con sus identificadores e iconos
const TABS: { id: string; icon: typeof UserPlus; adminOnly?: boolean; ownerOnly?: boolean }[] = [
    { id: "summary", icon: LayoutDashboard, ownerOnly: true },
    { id: "businesses", icon: Store, adminOnly: true },
    { id: "billing", icon: CreditCard, adminOnly: true },
    { id: "pending", icon: UserPlus },
    { id: "barbers", icon: Users },
    { id: "customers", icon: ShieldAlert },
    { id: "settings", icon: Settings, adminOnly: true },
    { id: "audit", icon: History, adminOnly: true },
];

type Props = {
    role: string;
};

export default function AdminDashboardClient({ role }: Props) {
    const t = useTranslations("AdminDashboard");
    const [activeTab, setActiveTab] = useState(role === "ADMIN" ? "businesses" : "summary");

    // Facturación y mantenimiento global son de la plataforma: solo los ve el ADMIN
    const tabs = TABS.filter((tab) => (!tab.adminOnly || role === "ADMIN") && (!tab.ownerOnly || role === "OWNER"));

    return (
        <div className="space-y-5 py-6">
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
            <div className="relative border-b border-gray-200">
                <div className="scroll-strip -mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:px-0">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative flex items-center gap-2 min-h-11 px-3 md:px-4 font-semibold text-sm transition-colors whitespace-nowrap ${isActive ? "text-indigo-600" : "text-gray-400 hover:text-gray-700"
                                    }`}
                            >
                                <Icon size={18} className={isActive ? "text-indigo-600" : "text-gray-400"} />
                                <span>{t(`tabs.${tab.id}`)}</span>

                                {/* Indicador Animado de Pestaña Activa */}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabIndicator"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#e8603a]"
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
                        {activeTab === "summary" && role === "OWNER" && <OwnerOverview />}
                        {activeTab === "pending" && <PendingBarbersList />}
                        {activeTab === "barbers" && <ActiveBarbersList />}
                        {activeTab === "customers" && <CustomersList />}
                        {activeTab === "settings" && role === "ADMIN" && <SystemSettings />}
                        {activeTab === "billing" && role === "ADMIN" && <BusinessBillingManager />}
                        {activeTab === "businesses" && role === "ADMIN" && <PlatformBusinesses />}
                        {activeTab === "audit" && role === "ADMIN" && <AuditLogList />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
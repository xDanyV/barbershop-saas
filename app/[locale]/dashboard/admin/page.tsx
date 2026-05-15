"use client";

import { useState } from "react";
import { UserPlus, Users, Settings, ShieldAlert } from "lucide-react";
import PendingBarbersList from "./components/PendingBarbersList";
import ActiveBarbersList from "./components/ActiveBarbersList";
import CustomersList from "./components/CustomersList";
import SystemSettings from "./components/SystemSettings";

// Definimos las pestañas disponibles
const TABS = [
    { id: "pending", label: "Aceptar Barberos", icon: UserPlus },
    { id: "barbers", label: "Administrar Barberos", icon: Users },
    { id: "customers", label: "Gestionar Clientes", icon: ShieldAlert },
    { id: "settings", label: "Configuración Global", icon: Settings },
];

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState("pending");

    return (
        <div className="space-y-8 p-4 md:p-8 max-w-6xl mx-auto">
            {/* Header del Admin */}
            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Admin Control Panel</h1>
                <p className="text-gray-500 font-medium">Manage your staff, customers, and global shop settings.</p>
            </div>

            {/* Menú de Navegación (Tabs) */}
            <div className="flex overflow-x-auto gap-2 pb-2 border-b border-gray-100 no-scrollbar">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-t-xl font-bold text-sm transition-all whitespace-nowrap ${isActive
                                    ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600"
                                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                }`}
                        >
                            <Icon size={18} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Contenedor Dinámico: Renderiza el componente según el tab activo */}
            <div className="pt-4">
                {activeTab === "pending" && <PendingBarbersList />}
                {activeTab === "barbers" && <ActiveBarbersList />}
                {activeTab === "customers" && <CustomersList />}
                {activeTab === "settings" && <SystemSettings />}
            </div>
        </div>
    );
}
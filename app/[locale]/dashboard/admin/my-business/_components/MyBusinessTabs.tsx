"use client";

import { Building2, ImageIcon, Newspaper } from "lucide-react";

export type BusinessTab = "profile" | "posts" | "gallery";

type Props = {
    activeTab: BusinessTab;
    onChange: (tab: BusinessTab) => void;
};

const tabs = [
    {
        id: "profile" as const,
        label: "Perfil",
        mobileLabel: "Perfil",
        description: "Información básica",
        icon: Building2,
    },
    {
        id: "posts" as const,
        label: "Publicaciones",
        mobileLabel: "Avisos",
        description: "Avisos y promociones",
        icon: Newspaper,
    },
    {
        id: "gallery" as const,
        label: "Galería",
        mobileLabel: "Galería",
        description: "Fotos del negocio",
        icon: ImageIcon,
    },
];

export default function MyBusinessTabs({ activeTab, onChange }: Props) {
    return (
        <div className="bg-white border border-gray-100 rounded-3xl p-2 shadow-sm overflow-hidden">
            <div className="grid grid-cols-3 gap-2">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => onChange(tab.id)}
                            className={`min-w-0 flex flex-col sm:flex-row items-center sm:items-center justify-center sm:justify-start gap-2 sm:gap-3 rounded-2xl px-2 sm:px-4 py-3 text-center sm:text-left transition-all ${isActive
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                                    : "text-gray-500 hover:bg-gray-50"
                                }`}
                        >
                            <div
                                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shrink-0 ${isActive
                                        ? "bg-white/15 text-white"
                                        : "bg-indigo-50 text-indigo-600"
                                    }`}
                            >
                                <Icon size={17} />
                            </div>

                            <div className="min-w-0">
                                <p className="text-[11px] sm:text-sm font-black leading-tight truncate">
                                    <span className="sm:hidden">
                                        {tab.mobileLabel}
                                    </span>
                                    <span className="hidden sm:inline">
                                        {tab.label}
                                    </span>
                                </p>

                                <p
                                    className={`hidden sm:block text-[11px] font-bold mt-0.5 truncate ${isActive ? "text-indigo-100" : "text-gray-400"
                                        }`}
                                >
                                    {tab.description}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
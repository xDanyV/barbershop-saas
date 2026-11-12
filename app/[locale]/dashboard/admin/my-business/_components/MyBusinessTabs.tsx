"use client";

import { Building2, CreditCard, ImageIcon, Newspaper } from "lucide-react";
import { useTranslations } from "next-intl";

export type BusinessTab = "profile" | "posts" | "gallery" | "membership";

type Props = {
    activeTab: BusinessTab;
    onChange: (tab: BusinessTab) => void;
};

const TABS = [
    { id: "profile", icon: Building2 },
    { id: "posts", icon: Newspaper },
    { id: "gallery", icon: ImageIcon },
    { id: "membership", icon: CreditCard },
] as const;

// Mismas pestañas que el panel de la plataforma: subrayado naranja en la activa
export default function MyBusinessTabs({ activeTab, onChange }: Props) {
    const t = useTranslations("MyBusiness.tabs");

    return (
        <div role="tablist" aria-label={t("label")} className="scroll-strip -mx-4 flex gap-1 overflow-x-auto border-b border-gray-200 px-4 md:mx-0 md:px-0">
            {TABS.map(({ id, icon: Icon }) => {
                const isActive = activeTab === id;

                return (
                    <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => onChange(id)}
                        className={`relative flex min-h-11 items-center gap-2 whitespace-nowrap px-3 text-sm font-semibold transition-colors md:px-4 ${isActive ? "text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
                    >
                        <Icon size={18} aria-hidden="true" />
                        {t(id)}
                        {isActive && <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-[#e8603a]" />}
                    </button>
                );
            })}
        </div>
    );
}

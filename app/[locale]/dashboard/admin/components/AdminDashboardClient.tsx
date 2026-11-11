"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CreditCard, History, Settings, ShieldAlert, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import PageHeader from "@/[locale]/components/PageHeader";
import AuditLogList from "./AuditLogList";
import BusinessBillingManager from "./BusinessBillingManager";
import CustomersList from "./CustomersList";
import PasswordResetTool from "./PasswordResetTool";
import PlatformBusinesses from "./PlatformBusinesses";
import SystemSettings from "./SystemSettings";

// Solo trabajo de la plataforma. El equipo y los clientes de cada barbería los administra su dueño.
const TABS = [
    { id: "businesses", icon: Store },
    { id: "billing", icon: CreditCard },
    { id: "moderation", icon: ShieldAlert },
    { id: "audit", icon: History },
    { id: "settings", icon: Settings },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AdminDashboardClient() {
    const t = useTranslations("AdminDashboard");
    const router = useRouter();
    const searchParams = useSearchParams();

    // La pestaña vive en la URL: recargar o volver atrás conserva dónde estabas
    const requested = searchParams.get("tab");
    const activeTab: TabId = TABS.some((tab) => tab.id === requested) ? (requested as TabId) : "businesses";

    const selectTab = (id: TabId) => router.replace(`?tab=${id}`, { scroll: false });

    return (
        <div className="pb-6">
            <PageHeader title={t("title")} subtitle={t("subtitle")} />

            <div role="tablist" aria-label={t("title")} className="scroll-strip -mx-4 flex gap-1 overflow-x-auto border-b border-gray-200 px-4 md:mx-0 md:px-0">
                {TABS.map(({ id, icon: Icon }) => {
                    const isActive = activeTab === id;

                    return (
                        <button
                            key={id}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => selectTab(id)}
                            className={`relative flex min-h-11 items-center gap-2 whitespace-nowrap px-3 text-sm font-semibold transition-colors md:px-4 ${isActive ? "text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
                        >
                            <Icon size={18} aria-hidden="true" />
                            {t(`tabs.${id}`)}
                            {isActive && <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-[#e8603a]" />}
                        </button>
                    );
                })}
            </div>

            <div role="tabpanel" className="pt-6">
                {activeTab === "businesses" && <PlatformBusinesses />}
                {activeTab === "billing" && <BusinessBillingManager />}
                {activeTab === "moderation" && (
                    <>
                        <PasswordResetTool />
                        <p className="mb-4 max-w-[70ch] text-gray-600">{t("moderationHint")}</p>
                        <CustomersList />
                    </>
                )}
                {activeTab === "audit" && <AuditLogList />}
                {activeTab === "settings" && <SystemSettings />}
            </div>
        </div>
    );
}

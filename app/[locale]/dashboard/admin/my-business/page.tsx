"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ChevronDown, Copy, Download, ExternalLink, QrCode, Share2 } from "lucide-react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { useLocale, useTranslations } from "next-intl";
import type { BusinessBillingStatus, BusinessPlanType } from "@prisma/client";
import { QRCodeCanvas } from "qrcode.react";
import { useApiError } from "@/[locale]/components/useApiError";
import PageHeader from "@/[locale]/components/PageHeader";
import BrandDialog, { brandPrimaryButton } from "@/[locale]/components/BrandDialog";

import BusinessProfileForm, { type BusinessForm, type ImageField } from "./_components/BusinessProfileForm";
import BusinessPostsManager from "./_components/BusinessPostsManager";
import BusinessGalleryManager from "./_components/BusinessGalleryManager";
import MyBusinessTabs, { type BusinessTab } from "./_components/MyBusinessTabs";
import BusinessBillingCard from "./_components/BusinessBillingCard";
import { primaryButton, secondaryButton } from "./_components/ui";

type Business = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    phone: string | null;
    address: string | null;
    logoUrl: string | null;
    coverUrl: string | null;
    themePrimary: string | null;
    themeAccent: string | null;
    billingStatus: BusinessBillingStatus;
    billingPlan: BusinessPlanType;
    subscriptionEndsAt: string | null;
    settings: { isServiceActive: boolean; autoConfirm: boolean; maintenanceMessage: string | null } | null;
};

const toForm = (data: Business): BusinessForm => ({
    name: data.name ?? "",
    description: data.description ?? "",
    phone: data.phone ?? "",
    address: data.address ?? "",
    logoUrl: data.logoUrl ?? "",
    coverUrl: data.coverUrl ?? "",
    isServiceActive: data.settings?.isServiceActive ?? true,
    autoConfirm: data.settings?.autoConfirm ?? true,
    maintenanceMessage: data.settings?.maintenanceMessage ?? "",
    themePrimary: data.themePrimary ?? null,
    themeAccent: data.themeAccent ?? null,
});

// Lo que los clientes ven de la barbería: perfil, colores, avisos, fotos y la membresía
export default function MyBusinessPage() {
    const t = useTranslations("MyBusiness");
    const locale = useLocale();
    const apiError = useApiError();
    const [business, setBusiness] = useState<Business | null>(null);
    const [form, setForm] = useState<BusinessForm | null>(null);
    const [failed, setFailed] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showQr, setShowQr] = useState(false);
    // El aviso de membresía enlaza directo a esta pestaña (?tab=membership)
    const [activeTab, setActiveTab] = useState<BusinessTab>(() =>
        typeof window !== "undefined" && new URLSearchParams(window.location.search).get("tab") === "membership" ? "membership" : "profile"
    );

    const publicUrl = business && typeof window !== "undefined" ? `${window.location.origin}/${locale}/business/${business.slug}` : "";

    useEffect(() => {
        fetch("/api/protected/businesses/me")
            .then(async (res) => {
                const data = await res.json().catch(() => null);
                if (!res.ok) throw new Error(apiError(data, t("errors.load")));
                setBusiness(data);
                setForm(toForm(data));
            })
            .catch((error: Error) => {
                setFailed(true);
                toast.error(error.message || t("errors.load"));
            });
    }, [apiError, t]);

    const updateField = <K extends keyof BusinessForm>(key: K, value: BusinessForm[K]) => {
        setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    };

    const patch = async (body: object) => {
        const res = await fetch("/api/protected/businesses/me", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => null);
        return { ok: res.ok, data };
    };

    // Solo la imagen; lo demás del formulario sigue pendiente de "Guardar cambios"
    const saveImage = async (field: ImageField, url: string) => {
        try {
            const { ok, data } = await patch({ [field]: url });
            if (!ok) {
                toast.error(apiError(data, t("errors.image")));
                return false;
            }
            setBusiness(data);
            updateField(field, url);
            return true;
        } catch {
            toast.error(t("errors.image"));
            return false;
        }
    };

    const handleSave = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!form) return;
        setSaving(true);

        try {
            const { ok, data } = await patch(form);
            if (!ok) {
                toast.error(apiError(data, t("errors.save")));
                return;
            }
            setBusiness(data);
            toast.success(t("saved"));
        } catch {
            toast.error(t("errors.save"));
        } finally {
            setSaving(false);
        }
    };

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(publicUrl);
            toast.success(t("share.copied"));
        } catch {
            toast.error(t("share.copyFailed"));
        }
    };

    const downloadQr = () => {
        const canvas = document.getElementById("business-qr-code") as HTMLCanvasElement | null;
        if (!canvas || !business) return;

        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = `QR-${business.slug}.png`;
        link.click();
    };

    if (!business || !form) {
        return (
            <div className="pb-6">
                <PageHeader title={t("title")} />
                <p className="text-gray-600">{failed ? t("errors.load") : t("loading")}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-6">
            <PageHeader
                title={t("title")}
                subtitle={t("subtitle")}
                actions={
                    <div className="grid grid-cols-2 gap-2 sm:flex">
                        <a href={publicUrl} target="_blank" rel="noopener noreferrer" className={primaryButton}>
                            {t("share.view")}
                            <ExternalLink size={16} aria-hidden="true" />
                        </a>
                        <Menu as="div" className="relative">
                            <MenuButton className={`${secondaryButton} w-full`}>
                                <Share2 size={16} aria-hidden="true" />
                                {t("share.label")}
                                <ChevronDown size={16} aria-hidden="true" />
                            </MenuButton>
                            <MenuItems anchor="bottom end" className="z-50 mt-1 w-56 border border-[#dbe0de] bg-white py-1 text-sm text-[#0f2733] outline-none">
                                <MenuItem>
                                    <button type="button" onClick={copyLink} className="flex min-h-11 w-full items-center gap-3 px-4 text-left data-[focus]:bg-[#f1f3f2]">
                                        <Copy size={18} aria-hidden="true" />
                                        {t("share.copy")}
                                    </button>
                                </MenuItem>
                                <MenuItem>
                                    <button type="button" onClick={() => setShowQr(true)} className="flex min-h-11 w-full items-center gap-3 px-4 text-left data-[focus]:bg-[#f1f3f2]">
                                        <QrCode size={18} aria-hidden="true" />
                                        {t("share.qr")}
                                    </button>
                                </MenuItem>
                            </MenuItems>
                        </Menu>
                    </div>
                }
            />

            <MyBusinessTabs activeTab={activeTab} onChange={setActiveTab} />

            {activeTab === "profile" && (
                <BusinessProfileForm form={form} saving={saving} onSubmit={handleSave} onUpdateField={updateField} onSaveImage={saveImage} />
            )}
            {activeTab === "posts" && <BusinessPostsManager />}
            {activeTab === "gallery" && <BusinessGalleryManager />}
            {activeTab === "membership" && (
                <BusinessBillingCard billingStatus={business.billingStatus} billingPlan={business.billingPlan} subscriptionEndsAt={business.subscriptionEndsAt} />
            )}

            {showQr && (
                <BrandDialog title={t("share.qrTitle")} subtitle={t("share.qrText", { name: business.name })} closeLabel={t("close")} onClose={() => setShowQr(false)}>
                    <div className="flex flex-col items-center gap-5">
                        <div className="border border-[var(--brand-surface)] bg-white p-3">
                            <QRCodeCanvas id="business-qr-code" value={publicUrl} size={220} level="Q" marginSize={2} />
                        </div>
                        <button type="button" onClick={downloadQr} className={`${brandPrimaryButton} gap-2`}>
                            <Download size={18} aria-hidden="true" />
                            {t("share.download")}
                        </button>
                    </div>
                </BrandDialog>
            )}
        </div>
    );
}

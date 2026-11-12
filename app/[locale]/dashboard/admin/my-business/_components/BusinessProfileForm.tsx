"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { ImageIcon, Loader2, MapPin, Phone, Trash2, UploadCloud } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import BusinessThemePicker from "./BusinessThemePicker";
import { card, fieldInput, fieldLabel, fieldTextarea, primaryButton, sectionHint, sectionTitle, useImageUpload } from "./ui";

export type BusinessForm = {
    name: string;
    description: string;
    phone: string;
    address: string;
    logoUrl: string;
    coverUrl: string;
    isServiceActive: boolean;
    autoConfirm: boolean;
    maintenanceMessage: string;
    themePrimary: string | null;
    themeAccent: string | null;
};

export type ImageField = "logoUrl" | "coverUrl";

type Props = {
    form: BusinessForm;
    saving: boolean;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onUpdateField: <K extends keyof BusinessForm>(key: K, value: BusinessForm[K]) => void;
    // El logo y la portada se guardan en cuanto se suben o se quitan
    onSaveImage: (field: ImageField, url: string) => Promise<boolean>;
};

function Switch({ checked, onChange, label, hint }: { checked: boolean; onChange: () => void; label: string; hint: string }) {
    return (
        <button type="button" role="switch" aria-checked={checked} onClick={onChange} className="flex w-full items-center justify-between gap-4 py-3 text-left">
            <span className="min-w-0">
                <span className="block font-semibold text-gray-900">{label}</span>
                <span className="mt-0.5 block text-sm text-gray-600">{hint}</span>
            </span>
            <span aria-hidden="true" className={`relative h-7 w-12 shrink-0 transition-colors ${checked ? "bg-[#2f7d5b]" : "bg-gray-300"}`}>
                <span className={`absolute top-1 h-5 w-5 bg-white transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
            </span>
        </button>
    );
}

export default function BusinessProfileForm({ form, saving, onSubmit, onUpdateField, onSaveImage }: Props) {
    const t = useTranslations("MyBusiness.profile");
    const logo = useImageUpload("businessLogoImage", { maxSize: 512, maxMb: 2 });
    const cover = useImageUpload("businessCoverImage", { maxSize: 1920, maxMb: 8 });
    const [removing, setRemoving] = useState<ImageField | null>(null);
    const busy = logo.uploading || cover.uploading || removing !== null;

    const pick = async (field: ImageField, event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        const url = await (field === "logoUrl" ? logo : cover).upload(file);
        if (url && (await onSaveImage(field, url))) toast.success(t(field === "logoUrl" ? "images.logoSaved" : "images.coverSaved"));
    };

    const remove = async (field: ImageField) => {
        setRemoving(field);
        if (await onSaveImage(field, "")) toast.success(t(field === "logoUrl" ? "images.logoRemoved" : "images.coverRemoved"));
        setRemoving(null);
    };

    const imageButton = (field: ImageField, uploading: boolean, hasImage: boolean) => (
        <label className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 bg-gray-900 px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 has-[:disabled]:pointer-events-none has-[:disabled]:opacity-50`}>
            <input type="file" accept="image/*" className="sr-only" disabled={busy} onChange={(event) => pick(field, event)} />
            {uploading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <UploadCloud size={16} aria-hidden="true" />}
            {uploading ? t("images.uploading") : t(`images.${field === "logoUrl" ? "logo" : "cover"}${hasImage ? "Change" : "Add"}`)}
        </label>
    );

    return (
        <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_22rem]">
            <div className="space-y-6">
                <section className={card}>
                    <h2 className={sectionTitle}>{t("basics.title")}</h2>
                    <p className={sectionHint}>{t("basics.hint")}</p>

                    <div className="mt-5 space-y-5">
                        <label className={fieldLabel}>
                            {t("basics.name")}
                            <input value={form.name} onChange={(e) => onUpdateField("name", e.target.value)} required minLength={3} maxLength={100} className={fieldInput} />
                        </label>

                        <label className={fieldLabel}>
                            {t("basics.description")}
                            <textarea
                                value={form.description}
                                onChange={(e) => onUpdateField("description", e.target.value)}
                                rows={4}
                                maxLength={1000}
                                placeholder={t("basics.descriptionPlaceholder")}
                                className={fieldTextarea}
                            />
                        </label>

                        <div className="grid gap-5 md:grid-cols-2">
                            <label className={fieldLabel}>
                                {t("basics.phone")}
                                <span className="relative block">
                                    <Phone size={16} className="pointer-events-none absolute left-4 top-[calc(50%+4px)] -translate-y-1/2 text-gray-500" aria-hidden="true" />
                                    <input
                                        type="tel"
                                        inputMode="tel"
                                        value={form.phone}
                                        onChange={(e) => onUpdateField("phone", e.target.value)}
                                        placeholder="6641234567"
                                        className={`${fieldInput} pl-11`}
                                    />
                                </span>
                            </label>

                            <label className={fieldLabel}>
                                {t("basics.address")}
                                <span className="relative block">
                                    <MapPin size={16} className="pointer-events-none absolute left-4 top-[calc(50%+4px)] -translate-y-1/2 text-gray-500" aria-hidden="true" />
                                    <input
                                        value={form.address}
                                        onChange={(e) => onUpdateField("address", e.target.value)}
                                        placeholder={t("basics.addressPlaceholder")}
                                        className={`${fieldInput} pl-11`}
                                    />
                                </span>
                            </label>
                        </div>
                        <p className="text-sm text-gray-600">{t("basics.addressHint")}</p>
                    </div>
                </section>

                <BusinessThemePicker businessName={form.name} primary={form.themePrimary} accent={form.themeAccent} onChange={onUpdateField} />
            </div>

            <div className="space-y-6">
                <section className={card}>
                    <h2 className={sectionTitle}>{t("images.title")}</h2>
                    <p className={sectionHint}>{t("images.hint")}</p>

                    <div className="mt-5 space-y-6">
                        <div>
                            <div className="flex items-center justify-between gap-3">
                                <p className="font-semibold text-gray-900">{t("images.logo")}</p>
                                {form.logoUrl && (
                                    <button type="button" onClick={() => remove("logoUrl")} disabled={busy} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[#b8431f] disabled:opacity-50">
                                        <Trash2 size={16} aria-hidden="true" />
                                        {t("images.remove")}
                                    </button>
                                )}
                            </div>
                            <p className="text-sm text-gray-600">{t("images.logoHint")}</p>
                            <div className="mt-3 flex items-center gap-3">
                                <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border border-gray-200 bg-[#f1f3f2] text-gray-400">
                                    {form.logoUrl ? <img src={form.logoUrl} alt={t("images.logoAlt")} className="h-full w-full object-cover" /> : <ImageIcon size={22} aria-hidden="true" />}
                                </span>
                                <div className="flex-1 [&>label]:w-full">{imageButton("logoUrl", logo.uploading, Boolean(form.logoUrl))}</div>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between gap-3">
                                <p className="font-semibold text-gray-900">{t("images.cover")}</p>
                                {form.coverUrl && (
                                    <button type="button" onClick={() => remove("coverUrl")} disabled={busy} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[#b8431f] disabled:opacity-50">
                                        <Trash2 size={16} aria-hidden="true" />
                                        {t("images.remove")}
                                    </button>
                                )}
                            </div>
                            <p className="text-sm text-gray-600">{t("images.coverHint")}</p>
                            <div className="mt-3 flex aspect-[16/9] items-center justify-center overflow-hidden border border-gray-200 bg-[#f1f3f2] text-gray-400">
                                {form.coverUrl ? <img src={form.coverUrl} alt={t("images.coverAlt")} className="h-full w-full object-cover" /> : <ImageIcon size={26} aria-hidden="true" />}
                            </div>
                            <div className="mt-3 [&>label]:w-full">{imageButton("coverUrl", cover.uploading, Boolean(form.coverUrl))}</div>
                        </div>
                    </div>
                </section>

                <section className={card}>
                    <h2 className={sectionTitle}>{t("bookings.title")}</h2>
                    <div className="mt-2 divide-y divide-gray-100">
                        <Switch
                            checked={form.isServiceActive}
                            onChange={() => onUpdateField("isServiceActive", !form.isServiceActive)}
                            label={t("bookings.active")}
                            hint={form.isServiceActive ? t("bookings.activeOn") : t("bookings.activeOff")}
                        />
                        <Switch
                            checked={form.autoConfirm}
                            onChange={() => onUpdateField("autoConfirm", !form.autoConfirm)}
                            label={t("bookings.autoConfirm")}
                            hint={form.autoConfirm ? t("bookings.autoConfirmOn") : t("bookings.autoConfirmOff")}
                        />
                    </div>

                    {!form.isServiceActive && (
                        <label className={`${fieldLabel} mt-4`}>
                            {t("bookings.pausedMessage")}
                            <textarea
                                value={form.maintenanceMessage}
                                onChange={(e) => onUpdateField("maintenanceMessage", e.target.value)}
                                rows={3}
                                maxLength={300}
                                placeholder={t("bookings.pausedPlaceholder")}
                                className={fieldTextarea}
                            />
                        </label>
                    )}
                </section>
            </div>

            {/* Siempre a la mano, también en el celular (arriba de la barra de navegación) */}
            <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 -mx-4 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur md:bottom-0 md:mx-0 md:px-0 lg:col-span-2">
                <div className="flex items-center justify-between gap-4">
                    <p className="hidden text-sm text-gray-600 sm:block">{t("saveHint")}</p>
                    <button type="submit" disabled={saving || busy} className={`${primaryButton} w-full sm:w-auto`}>
                        {saving && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                        {saving ? t("saving") : t("save")}
                    </button>
                </div>
            </div>
        </form>
    );
}

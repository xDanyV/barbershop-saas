"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2, MapPin, Phone } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { useApiError } from "@/[locale]/components/useApiError";
import { TRIAL_DAYS } from "@/lib/billing/periods";
import PageHeader from "@/[locale]/components/PageHeader";
import { card, fieldInput, fieldLabel, fieldTextarea, primaryButton, secondaryButton, sectionHint, sectionTitle } from "@/[locale]/dashboard/admin/my-business/_components/ui";

type Business = { id: string; name: string; slug: string };

// Un cliente registra su barbería: con esto ya tiene página pública y pasa a ser dueño
export default function CreateBusinessPage() {
    const t = useTranslations("CreateBusiness");
    const locale = useLocale();
    const apiError = useApiError();
    const [existing, setExisting] = useState<Business[] | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: "", description: "", phone: "", address: "" });

    useEffect(() => {
        fetch("/api/protected/businesses")
            .then((res) => (res.ok ? res.json() : []))
            .then((data) => setExisting(Array.isArray(data) ? data : []))
            // Si solo falla la revisión, el formulario sigue disponible
            .catch(() => setExisting([]));
    }, []);

    const update = (key: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (form.name.trim().length < 3) return void toast.error(t("errors.nameShort"));

        setSaving(true);
        try {
            const res = await fetch("/api/protected/businesses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json().catch(() => null);

            if (!res.ok) {
                toast.error(apiError(data, t("errors.failed")));
                return;
            }

            toast.success(t("created"));
            // La sesión ya refleja el nuevo rol y negocio; no hace falta volver a iniciar sesión
            window.location.href = `/${locale}/dashboard/admin`;
        } catch {
            toast.error(t("errors.failed"));
        } finally {
            setSaving(false);
        }
    };

    if (existing === null) {
        return (
            <div className="pb-6">
                <PageHeader title={t("title")} />
                <p className="flex items-center gap-2 text-gray-600">
                    <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                    {t("checking")}
                </p>
            </div>
        );
    }

    if (existing.length > 0) {
        const business = existing[0];

        return (
            <div className="mx-auto max-w-xl pb-6">
                <PageHeader title={t("existingTitle")} />
                <section className={card}>
                    <p className="text-gray-600">{t("existingText")}</p>
                    <p className="mt-2 break-words text-xl font-semibold text-gray-900">{business.name}</p>
                    <div className="mt-6 grid gap-2 sm:grid-cols-2">
                        <a href={`/${locale}/dashboard/admin/my-business`} className={primaryButton}>
                            {t("goToBusiness")}
                        </a>
                        <a href={`/${locale}/business/${business.slug}`} target="_blank" rel="noopener noreferrer" className={secondaryButton}>
                            {t("viewPage")}
                        </a>
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl pb-6">
            <PageHeader title={t("title")} subtitle={t("subtitle")} />

            <form onSubmit={submit} className="space-y-6">
                <section className={card}>
                    <h2 className={sectionTitle}>{t("detailsTitle")}</h2>
                    <p className={sectionHint}>{t("detailsHint")}</p>

                    <div className="mt-5 space-y-5">
                        <label className={fieldLabel}>
                            {t("name")}
                            <input value={form.name} onChange={(e) => update("name", e.target.value)} required minLength={3} maxLength={100} placeholder={t("namePlaceholder")} className={fieldInput} />
                        </label>

                        <label className={fieldLabel}>
                            {t("description")}
                            <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={4} maxLength={1000} placeholder={t("descriptionPlaceholder")} className={fieldTextarea} />
                        </label>

                        <div className="grid gap-5 md:grid-cols-2">
                            <label className={fieldLabel}>
                                {t("phone")}
                                <span className="relative block">
                                    <Phone size={16} className="pointer-events-none absolute left-4 top-[calc(50%+4px)] -translate-y-1/2 text-gray-500" aria-hidden="true" />
                                    <input type="tel" inputMode="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="6641234567" className={`${fieldInput} pl-11`} />
                                </span>
                            </label>
                            <label className={fieldLabel}>
                                {t("address")}
                                <span className="relative block">
                                    <MapPin size={16} className="pointer-events-none absolute left-4 top-[calc(50%+4px)] -translate-y-1/2 text-gray-500" aria-hidden="true" />
                                    <input value={form.address} onChange={(e) => update("address", e.target.value)} placeholder={t("addressPlaceholder")} className={`${fieldInput} pl-11`} />
                                </span>
                            </label>
                        </div>
                    </div>
                </section>

                <p className="border-l-4 border-[#e8603a] bg-white p-4 text-gray-700">{t("trial", { days: TRIAL_DAYS })}</p>

                <button type="submit" disabled={saving} className={`${primaryButton} w-full sm:w-auto`}>
                    {saving && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                    {saving ? t("creating") : t("create")}
                </button>
            </form>
        </div>
    );
}

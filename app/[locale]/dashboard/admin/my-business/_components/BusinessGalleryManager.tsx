"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, UploadCloud } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import BrandDialog, { brandPrimaryButton } from "@/[locale]/components/BrandDialog";
import { useApiError } from "@/[locale]/components/useApiError";
import { card, fieldInput, fieldLabel, primaryButton, secondaryButton, sectionHint, sectionTitle, useImageUpload } from "./ui";

type GalleryItem = {
    id: string;
    imageUrl: string;
    caption: string | null;
    createdAt: string;
};

// Fotos del local y de los cortes que aparecen en "Galería" de la página pública
export default function BusinessGalleryManager() {
    const t = useTranslations("MyBusiness.gallery");
    const apiError = useApiError();
    const [items, setItems] = useState<GalleryItem[] | null>(null);
    const [adding, setAdding] = useState(false);
    const [imageUrl, setImageUrl] = useState("");
    const [caption, setCaption] = useState("");
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<GalleryItem | null>(null);
    const [deletingNow, setDeletingNow] = useState(false);
    const image = useImageUpload("businessGalleryImage", { maxSize: 1600, maxMb: 8 });

    useEffect(() => {
        fetch("/api/protected/businesses/me/gallery")
            .then(async (res) => {
                const data = await res.json().catch(() => null);
                if (!res.ok || !Array.isArray(data)) throw new Error(apiError(data, t("errors.load")));
                setItems(data);
            })
            .catch((error: Error) => {
                setItems([]);
                toast.error(error.message || t("errors.load"));
            });
    }, [apiError, t]);

    const open = () => {
        setImageUrl("");
        setCaption("");
        setAdding(true);
    };

    const close = () => {
        if (saving || image.uploading) return;
        setAdding(false);
    };

    const pick = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        const url = await image.upload(file);
        if (url) setImageUrl(url);
    };

    const add = async (event: FormEvent) => {
        event.preventDefault();
        if (!imageUrl) return;
        setSaving(true);

        try {
            const res = await fetch("/api/protected/businesses/me/gallery", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageUrl, caption }),
            });
            const data = await res.json().catch(() => null);

            if (!res.ok) {
                toast.error(apiError(data, t("errors.create")));
                return;
            }

            setItems((prev) => [data, ...(prev ?? [])]);
            setAdding(false);
            toast.success(t("created"));
        } catch {
            toast.error(t("errors.create"));
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        if (!deleting) return;
        setDeletingNow(true);

        try {
            const res = await fetch(`/api/protected/businesses/me/gallery/${deleting.id}`, { method: "DELETE" });
            const data = await res.json().catch(() => null);

            if (!res.ok) {
                toast.error(apiError(data, t("errors.delete")));
                return;
            }

            setItems((prev) => (prev ?? []).filter((item) => item.id !== deleting.id));
            setDeleting(null);
            toast.success(t("deleted"));
        } catch {
            toast.error(t("errors.delete"));
        } finally {
            setDeletingNow(false);
        }
    };

    return (
        <section className={card}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className={sectionTitle}>{t("title")}</h2>
                    <p className={sectionHint}>{t("hint")}</p>
                </div>
                <button type="button" onClick={open} className={`${primaryButton} shrink-0`}>
                    <Plus size={16} aria-hidden="true" />
                    {t("add")}
                </button>
            </div>

            {items === null ? (
                <p className="mt-6 text-gray-600">{t("loading")}</p>
            ) : items.length === 0 ? (
                <div className="mt-6 border border-dashed border-gray-300 p-8 text-center">
                    <p className="font-semibold text-gray-900">{t("emptyTitle")}</p>
                    <p className="mx-auto mt-1 max-w-md text-gray-600">{t("emptyText")}</p>
                </div>
            ) : (
                <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
                    {items.map((item) => (
                        <li key={item.id} className="group relative">
                            <img src={item.imageUrl} alt={item.caption || t("photoAlt")} className="aspect-square w-full bg-[#f1f3f2] object-cover" />
                            <div className="flex items-start justify-between gap-2 pt-2">
                                <p className="min-w-0 break-words text-sm text-gray-700">{item.caption}</p>
                                <button
                                    type="button"
                                    onClick={() => setDeleting(item)}
                                    aria-label={t("deleteLabel", { caption: item.caption || t("photoAlt") })}
                                    className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center text-[#b8431f]"
                                >
                                    <Trash2 size={18} aria-hidden="true" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {adding && (
                <BrandDialog title={t("add")} subtitle={t("addHint")} closeLabel={t("cancel")} onClose={close}>
                    <form onSubmit={add} className="space-y-5">
                        {imageUrl ? (
                            <div>
                                {/* Altura limitada: una foto vertical no empuja los botones fuera de la pantalla */}
                                <img src={imageUrl} alt="" className="max-h-56 w-full border border-gray-200 bg-[#f1f3f2] object-contain" />
                                <label className={`${secondaryButton} mt-2 cursor-pointer has-[:disabled]:opacity-50`}>
                                    <input type="file" accept="image/*" className="sr-only" disabled={image.uploading || saving} onChange={pick} />
                                    {image.uploading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <UploadCloud size={16} aria-hidden="true" />}
                                    {image.uploading ? t("uploading") : t("changeImage")}
                                </label>
                            </div>
                        ) : (
                            <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-gray-300 bg-[#f1f3f2] px-4 text-center transition-colors hover:border-gray-900 has-[:disabled]:opacity-50">
                                <input type="file" accept="image/*" className="sr-only" disabled={image.uploading || saving} onChange={pick} />
                                {image.uploading ? <Loader2 size={20} className="animate-spin" aria-hidden="true" /> : <UploadCloud size={20} aria-hidden="true" />}
                                <span className="font-semibold">{image.uploading ? t("uploading") : t("pickImage")}</span>
                                <span className="text-sm text-gray-600">{t("imageHint")}</span>
                            </label>
                        )}

                        <label className={fieldLabel}>
                            {t("caption")}
                            <input value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={200} placeholder={t("captionPlaceholder")} className={fieldInput} />
                        </label>

                        {/* Fijo abajo de la ventana: con una foto alta el botón sigue a la vista */}
                        <div className="sticky bottom-0 -mx-5 border-t border-[var(--brand-surface)] bg-[var(--brand-paper)] px-5 py-3 sm:-mx-8 sm:px-8">
                            <button type="submit" disabled={saving || image.uploading || !imageUrl} className={`${brandPrimaryButton} gap-2`}>
                                {saving && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                                {saving ? t("adding") : t("add")}
                            </button>
                        </div>
                    </form>
                </BrandDialog>
            )}

            {deleting && (
                <BrandDialog title={t("deleteTitle")} subtitle={t("deleteText")} closeLabel={t("keep")} onClose={() => !deletingNow && setDeleting(null)}>
                    <button type="button" onClick={remove} disabled={deletingNow} className={brandPrimaryButton}>
                        {t("delete")}
                    </button>
                </BrandDialog>
            )}
        </section>
    );
}

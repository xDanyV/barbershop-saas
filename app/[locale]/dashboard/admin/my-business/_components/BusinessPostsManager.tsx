"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, UploadCloud } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import BrandDialog, { brandPrimaryButton } from "@/[locale]/components/BrandDialog";
import { useApiError } from "@/[locale]/components/useApiError";
import { card, dangerLink, fieldLabel, fieldTextarea, primaryButton, secondaryButton, sectionHint, sectionTitle, useImageUpload } from "./ui";

type Post = {
    id: string;
    content: string;
    imageUrl: string | null;
    createdAt: string;
};

// Avisos y promociones que aparecen en "Novedades" de la página pública
export default function BusinessPostsManager() {
    const t = useTranslations("MyBusiness.posts");
    const locale = useLocale();
    const apiError = useApiError();
    const [posts, setPosts] = useState<Post[] | null>(null);
    const [creating, setCreating] = useState(false);
    const [content, setContent] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<Post | null>(null);
    const [deletingNow, setDeletingNow] = useState(false);
    const image = useImageUpload("businessPostImage", { maxSize: 1600, maxMb: 8 });

    useEffect(() => {
        fetch("/api/protected/businesses/me/posts")
            .then(async (res) => {
                const data = await res.json().catch(() => null);
                if (!res.ok || !Array.isArray(data)) throw new Error(apiError(data, t("errors.load")));
                setPosts(data);
            })
            .catch((error: Error) => {
                setPosts([]);
                toast.error(error.message || t("errors.load"));
            });
    }, [apiError, t]);

    const open = () => {
        setContent("");
        setImageUrl("");
        setCreating(true);
    };

    const close = () => {
        if (saving || image.uploading) return;
        setCreating(false);
    };

    const pick = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        const url = await image.upload(file);
        if (url) setImageUrl(url);
    };

    const create = async (event: FormEvent) => {
        event.preventDefault();
        if (content.trim().length < 3) return toast.error(t("errors.short"));
        setSaving(true);

        try {
            const res = await fetch("/api/protected/businesses/me/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content, imageUrl }),
            });
            const data = await res.json().catch(() => null);

            if (!res.ok) {
                toast.error(apiError(data, t("errors.create")));
                return;
            }

            setPosts((prev) => [data, ...(prev ?? [])]);
            setCreating(false);
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
            const res = await fetch(`/api/protected/businesses/me/posts/${deleting.id}`, { method: "DELETE" });
            const data = await res.json().catch(() => null);

            if (!res.ok) {
                toast.error(apiError(data, t("errors.delete")));
                return;
            }

            setPosts((prev) => (prev ?? []).filter((post) => post.id !== deleting.id));
            setDeleting(null);
            toast.success(t("deleted"));
        } catch {
            toast.error(t("errors.delete"));
        } finally {
            setDeletingNow(false);
        }
    };

    const dateLabel = (iso: string) =>
        new Date(iso).toLocaleDateString(locale === "en" ? "en-US" : "es-MX", { day: "numeric", month: "long", year: "numeric" });

    return (
        <section className={card}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className={sectionTitle}>{t("title")}</h2>
                    <p className={sectionHint}>{t("hint")}</p>
                </div>
                <button type="button" onClick={open} className={`${primaryButton} shrink-0`}>
                    <Plus size={16} aria-hidden="true" />
                    {t("new")}
                </button>
            </div>

            {posts === null ? (
                <p className="mt-6 text-gray-600">{t("loading")}</p>
            ) : posts.length === 0 ? (
                <div className="mt-6 border border-dashed border-gray-300 p-8 text-center">
                    <p className="font-semibold text-gray-900">{t("emptyTitle")}</p>
                    <p className="mx-auto mt-1 max-w-md text-gray-600">{t("emptyText")}</p>
                </div>
            ) : (
                <ul className="mt-6 divide-y divide-gray-100 border-y border-gray-100">
                    {posts.map((post) => (
                        <li key={post.id} className="flex flex-col gap-4 py-4 sm:flex-row">
                            {post.imageUrl && <img src={post.imageUrl} alt="" className="aspect-[4/3] w-full shrink-0 object-cover sm:w-40" />}
                            <div className="min-w-0 flex-1">
                                <p className="text-sm text-gray-500">{dateLabel(post.createdAt)}</p>
                                <p className="mt-1 whitespace-pre-line break-words text-gray-900">{post.content}</p>
                            </div>
                            <div className="shrink-0 self-start">
                                <button type="button" onClick={() => setDeleting(post)} className={dangerLink}>
                                    <Trash2 size={16} aria-hidden="true" />
                                    {t("delete")}
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {creating && (
                <BrandDialog title={t("new")} subtitle={t("newHint")} closeLabel={t("cancel")} onClose={close}>
                    <form onSubmit={create} className="space-y-5">
                        <label className={fieldLabel}>
                            {t("text")}
                            <textarea
                                value={content}
                                onChange={(event) => setContent(event.target.value)}
                                rows={4}
                                maxLength={2000}
                                required
                                placeholder={t("textPlaceholder")}
                                className={fieldTextarea}
                            />
                        </label>

                        <div>
                            <p className={fieldLabel}>{t("image")}</p>
                            {imageUrl ? (
                                <div className="mt-2">
                                    {/* Altura limitada: una foto vertical no empuja los botones fuera de la pantalla */}
                                    <img src={imageUrl} alt="" className="max-h-56 w-full border border-gray-200 bg-[#f1f3f2] object-contain" />
                                    <div className="mt-2 flex gap-2">
                                        <label className={`${secondaryButton} cursor-pointer has-[:disabled]:opacity-50`}>
                                            <input type="file" accept="image/*" className="sr-only" disabled={image.uploading || saving} onChange={pick} />
                                            {image.uploading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <UploadCloud size={16} aria-hidden="true" />}
                                            {image.uploading ? t("uploading") : t("changeImage")}
                                        </label>
                                        <button type="button" onClick={() => setImageUrl("")} disabled={image.uploading || saving} className={dangerLink}>
                                            {t("removeImage")}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <label className="mt-2 flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-gray-300 bg-[#f1f3f2] px-4 text-center transition-colors hover:border-gray-900 has-[:disabled]:opacity-50">
                                    <input type="file" accept="image/*" className="sr-only" disabled={image.uploading || saving} onChange={pick} />
                                    {image.uploading ? <Loader2 size={20} className="animate-spin" aria-hidden="true" /> : <UploadCloud size={20} aria-hidden="true" />}
                                    <span className="font-semibold">{image.uploading ? t("uploading") : t("addImage")}</span>
                                    <span className="text-sm text-gray-600">{t("imageHint")}</span>
                                </label>
                            )}
                        </div>

                        {/* Fijo abajo de la ventana: con una foto alta el botón sigue a la vista */}
                        <div className="sticky bottom-0 -mx-5 border-t border-[var(--brand-surface)] bg-[var(--brand-paper)] px-5 py-3 sm:-mx-8 sm:px-8">
                            <button type="submit" disabled={saving || image.uploading || content.trim().length < 3} className={`${brandPrimaryButton} gap-2`}>
                                {saving && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                                {saving ? t("publishing") : t("publish")}
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

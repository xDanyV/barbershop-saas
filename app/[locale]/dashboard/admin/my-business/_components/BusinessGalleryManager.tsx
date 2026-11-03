"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import {
    CalendarDays,
    ImageIcon,
    Loader2,
    Plus,
    Trash2,
    UploadCloud,
    X,
} from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing";

type GalleryItem = {
    id: string;
    imageUrl: string;
    caption: string | null;
    createdAt: string;
};

export default function BusinessGalleryManager() {
    const [gallery, setGallery] = useState<GalleryItem[]>([]);
    const [imageUrl, setImageUrl] = useState("");
    const [caption, setCaption] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { startUpload } = useUploadThing("businessGalleryImage", {
        onClientUploadComplete: (res) => {
            const uploadedUrl = res?.[0]?.serverData?.url ?? res?.[0]?.url;

            if (!uploadedUrl) {
                toast.error("No se pudo obtener la URL de la imagen");
                setUploading(false);
                return;
            }

            setImageUrl(uploadedUrl);
            toast.success("Imagen subida. Ahora puedes agregarla a la galería.");
            setUploading(false);
        },
        onUploadError: (error) => {
            console.error("Gallery upload error:", error);
            toast.error(error.message || "No se pudo subir la imagen");
            setUploading(false);
        },
    });

    const loadGallery = async () => {
        try {
            const res = await fetch("/api/protected/businesses/me/gallery");
            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || "No se pudo cargar la galería");
                return;
            }

            if (Array.isArray(data)) {
                setGallery(data);
            }
        } catch {
            toast.error("Error al cargar galería");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadGallery();
    }, []);

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsModalOpen(false);
            }
        };

        window.addEventListener("keydown", handleEscape);

        return () => window.removeEventListener("keydown", handleEscape);
    }, []);

    const resetForm = () => {
        setImageUrl("");
        setCaption("");
        setUploading(false);
    };

    const handleOpenModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        if (saving || uploading) return;

        setIsModalOpen(false);
        resetForm();
    };

    const handleUploadSelected = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        event.target.value = "";

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Selecciona una imagen válida");
            return;
        }

        const maxSizeInMb = 8;
        const maxSizeInBytes = maxSizeInMb * 1024 * 1024;

        if (file.size > maxSizeInBytes) {
            toast.error(`La imagen no debe pesar más de ${maxSizeInMb}MB`);
            return;
        }

        setUploading(true);
        await startUpload([file]);
    };

    const handleCreateImage = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!imageUrl.trim()) {
            toast.error("Primero sube una imagen");
            return;
        }

        setSaving(true);

        try {
            const res = await fetch("/api/protected/businesses/me/gallery", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    imageUrl,
                    caption,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || "No se pudo agregar la imagen");
                return;
            }

            setGallery((prev) => [data, ...prev]);

            setIsModalOpen(false);
            resetForm();
            toast.success("Imagen agregada a la galería");
        } catch {
            toast.error("Error al agregar imagen");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteImage = async (itemId: string) => {
        const confirmed = window.confirm("¿Eliminar esta imagen de la galería?");

        if (!confirmed) return;

        setDeletingId(itemId);

        try {
            const res = await fetch(`/api/protected/businesses/me/gallery/${itemId}`, {
                method: "DELETE",
            });

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                toast.error(data?.error || "No se pudo eliminar la imagen");
                return;
            }

            setGallery((prev) => prev.filter((item) => item.id !== itemId));
            toast.success("Imagen eliminada");
        } catch {
            toast.error("Error al eliminar imagen");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <>
            <motion.section
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-100 rounded-3xl p-5 md:p-7 shadow-sm"
            >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                            <ImageIcon size={21} />
                        </div>

                        <div>
                            <h2 className="text-xl font-black text-gray-900">
                                Galería
                            </h2>
                            <p className="text-xs text-gray-500">
                                Administra las fotos que aparecerán en la página pública.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="px-4 py-2 rounded-xl bg-gray-50 border border-gray-100 text-xs font-black text-gray-500 flex items-center justify-center">
                            {gallery.length} foto{gallery.length === 1 ? "" : "s"}
                        </div>

                        <button
                            type="button"
                            onClick={handleOpenModal}
                            className="px-4 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-black hover:bg-purple-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-100"
                        >
                            <Plus size={15} />
                            Agregar imagen
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="min-h-56 flex items-center justify-center text-gray-400 text-sm font-bold">
                        <Loader2 className="animate-spin mr-2" size={16} />
                        Cargando galería...
                    </div>
                ) : gallery.length === 0 ? (
                    <div className="min-h-72 rounded-3xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center text-center px-6">
                        <div className="w-14 h-14 rounded-2xl bg-white text-gray-400 flex items-center justify-center mb-4 shadow-sm">
                            <ImageIcon size={26} />
                        </div>

                        <h3 className="text-lg font-black text-gray-800">
                            Aún no hay imágenes
                        </h3>

                        <p className="text-sm text-gray-500 mt-2 max-w-md">
                            Agrega fotos de cortes, interior del negocio, fachada o trabajos realizados.
                        </p>

                        <button
                            type="button"
                            onClick={handleOpenModal}
                            className="mt-5 px-5 py-3 rounded-2xl bg-purple-600 text-white text-sm font-black hover:bg-purple-700 transition-all flex items-center gap-2"
                        >
                            <Plus size={16} />
                            Agregar primera imagen
                        </button>
                    </div>
                ) : (
                    <div className="max-h-162.5 overflow-y-auto pr-1 pb-24 md:pb-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {gallery.map((item) => (
                                <article
                                    key={item.id}
                                    className="rounded-3xl border border-gray-100 bg-gray-50 overflow-hidden hover:shadow-sm transition-all"
                                >
                                    <div className="relative">
                                        <img
                                            src={item.imageUrl}
                                            alt={item.caption || "Imagen de galería"}
                                            className="w-full aspect-4/3 object-cover"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => handleDeleteImage(item.id)}
                                            disabled={deletingId === item.id}
                                            className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-white/95 text-red-500 flex items-center justify-center shadow-sm hover:bg-red-50 disabled:opacity-50 transition-all"
                                            aria-label="Eliminar imagen"
                                        >
                                            {deletingId === item.id ? (
                                                <Loader2 className="animate-spin" size={15} />
                                            ) : (
                                                <Trash2 size={15} />
                                            )}
                                        </button>
                                    </div>

                                    <div className="p-4">
                                        <p className="text-sm font-bold text-gray-800 line-clamp-2 min-h-10">
                                            {item.caption || "Imagen de galería"}
                                        </p>

                                        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-400 font-bold">
                                            <CalendarDays size={13} />
                                            {new Date(item.createdAt).toLocaleDateString("es-MX")}
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                )}
            </motion.section>

            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm px-4 flex items-center justify-center"
                        onClick={handleCloseModal}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 24, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 24, scale: 0.96 }}
                            transition={{ duration: 0.2 }}
                            className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-start justify-between gap-4 p-5 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                        <ImageIcon size={20} />
                                    </div>

                                    <div>
                                        <h3 className="font-black text-gray-900">
                                            Agregar imagen
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Sube una foto para la galería pública.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    disabled={saving || uploading}
                                    className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 flex items-center justify-center disabled:opacity-50"
                                >
                                    <X size={17} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateImage} className="p-5 space-y-4">
                                <div className="rounded-3xl border border-dashed border-purple-200 bg-purple-50/40 p-5">
                                    <input
                                        id="business-gallery-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        disabled={saving || uploading}
                                        onChange={handleUploadSelected}
                                    />

                                    <label
                                        htmlFor="business-gallery-upload"
                                        className={`flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-3xl border border-purple-100 bg-white px-5 py-8 text-center transition-all ${saving || uploading
                                                ? "opacity-60 pointer-events-none"
                                                : "hover:border-purple-300 hover:bg-purple-50/40"
                                            }`}
                                    >
                                        <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                                            {uploading ? (
                                                <Loader2 className="animate-spin" size={24} />
                                            ) : (
                                                <UploadCloud size={25} />
                                            )}
                                        </div>

                                        <p className="text-sm font-black text-gray-900">
                                            {uploading
                                                ? "Subiendo imagen..."
                                                : imageUrl
                                                    ? "Cambiar imagen"
                                                    : "Subir imagen"}
                                        </p>

                                        <p className="text-xs text-gray-400 font-bold mt-1">
                                            PNG, JPG o WEBP. Máximo 8MB.
                                        </p>
                                    </label>
                                </div>

                                {imageUrl.trim() && (
                                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                                        <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                                            Vista previa
                                        </p>

                                        <img
                                            src={imageUrl}
                                            alt="Vista previa"
                                            className="w-full max-h-64 object-cover rounded-xl border border-gray-100"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">
                                        Descripción opcional
                                    </label>

                                    <input
                                        value={caption}
                                        onChange={(e) => setCaption(e.target.value)}
                                        className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                                        placeholder="Ej. Corte clásico, fachada, interior..."
                                    />
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        disabled={saving || uploading}
                                        className="w-full py-3 rounded-2xl bg-gray-100 text-gray-600 text-sm font-black hover:bg-gray-200 disabled:opacity-50 transition-all"
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={saving || uploading || !imageUrl.trim()}
                                        className="w-full py-3 rounded-2xl bg-purple-600 text-white text-sm font-black hover:bg-purple-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="animate-spin" size={17} />
                                                Agregando...
                                            </>
                                        ) : (
                                            <>
                                                <Plus size={17} />
                                                Agregar imagen
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
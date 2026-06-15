"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import {
    CalendarDays,
    ImageIcon,
    Loader2,
    Megaphone,
    Newspaper,
    Plus,
    Trash2,
    X,
} from "lucide-react";

type BusinessPost = {
    id: string;
    content: string;
    imageUrl: string | null;
    createdAt: string;
};

export default function BusinessPostsManager() {
    const [posts, setPosts] = useState<BusinessPost[]>([]);
    const [content, setContent] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const loadPosts = async () => {
        try {
            const res = await fetch("/api/protected/businesses/me/posts");
            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || "No se pudieron cargar las publicaciones");
                return;
            }

            if (Array.isArray(data)) {
                setPosts(data);
            }
        } catch {
            toast.error("Error al cargar publicaciones");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPosts();
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
        setContent("");
        setImageUrl("");
    };

    const handleCloseModal = () => {
        if (saving) return;

        setIsModalOpen(false);
        resetForm();
    };

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();

        if (content.trim().length < 3) {
            toast.error("La publicación debe tener al menos 3 caracteres");
            return;
        }

        setSaving(true);

        try {
            const res = await fetch("/api/protected/businesses/me/posts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    content,
                    imageUrl,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || "No se pudo crear la publicación");
                return;
            }

            setPosts((prev) => [data, ...prev]);
            setIsModalOpen(false);
            resetForm();
            toast.success("Publicación creada");
        } catch {
            toast.error("Error al crear publicación");
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePost = async (postId: string) => {
        const confirmed = window.confirm("¿Eliminar esta publicación?");

        if (!confirmed) return;

        setDeletingId(postId);

        try {
            const res = await fetch(`/api/protected/businesses/me/posts/${postId}`, {
                method: "DELETE",
            });

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                toast.error(data?.error || "No se pudo eliminar");
                return;
            }

            setPosts((prev) => prev.filter((post) => post.id !== postId));
            toast.success("Publicación eliminada");
        } catch {
            toast.error("Error al eliminar publicación");
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
                        <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                            <Newspaper size={21} />
                        </div>

                        <div>
                            <h2 className="text-xl font-black text-gray-900">
                                Publicaciones
                            </h2>
                            <p className="text-xs text-gray-500">
                                Administra avisos, promociones o novedades visibles en la página pública.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="px-4 py-2 rounded-xl bg-gray-50 border border-gray-100 text-xs font-black text-gray-500 flex items-center justify-center">
                            {posts.length} publicación{posts.length === 1 ? "" : "es"}
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsModalOpen(true)}
                            className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-black hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
                        >
                            <Plus size={15} />
                            Nueva publicación
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="min-h-56 flex items-center justify-center text-gray-400 text-sm font-bold">
                        <Loader2 className="animate-spin mr-2" size={16} />
                        Cargando publicaciones...
                    </div>
                ) : posts.length === 0 ? (
                    <div className="min-h-72 rounded-3xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center text-center px-6">
                        <div className="w-14 h-14 rounded-2xl bg-white text-gray-400 flex items-center justify-center mb-4 shadow-sm">
                            <Megaphone size={26} />
                        </div>

                        <h3 className="text-lg font-black text-gray-800">
                            Aún no hay publicaciones
                        </h3>

                        <p className="text-sm text-gray-500 mt-2 max-w-md">
                            Crea una publicación para mostrar promociones, avisos o novedades en la página pública del negocio.
                        </p>

                        <button
                            type="button"
                            onClick={() => setIsModalOpen(true)}
                            className="mt-5 px-5 py-3 rounded-2xl bg-indigo-600 text-white text-sm font-black hover:bg-indigo-700 transition-all flex items-center gap-2"
                        >
                            <Plus size={16} />
                            Crear primera publicación
                        </button>
                    </div>
                ) : (
                    <div className="max-h-162.5 overflow-y-auto pr-1 pb-24 md:pb-2">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {posts.map((post, index) => {
                                const isFeatured = index === 0 && post.content.length > 140;

                                return (
                                    <article
                                        key={post.id}
                                        className={`rounded-3xl border border-gray-100 bg-gray-50 overflow-hidden hover:shadow-sm transition-all ${isFeatured ? "lg:col-span-2" : ""
                                            }`}
                                    >
                                        <div
                                            className={`grid grid-cols-1 ${isFeatured ? "md:grid-cols-[280px_1fr]" : ""
                                                }`}
                                        >
                                            {post.imageUrl ? (
                                                <img
                                                    src={post.imageUrl}
                                                    alt="Publicación"
                                                    className={`w-full object-cover ${isFeatured
                                                        ? "h-56 md:h-64"
                                                        : "h-44"
                                                        }`}
                                                />
                                            ) : (
                                                <div
                                                    className={`w-full bg-indigo-50 text-indigo-300 flex items-center justify-center ${isFeatured
                                                        ? "h-44 md:h-64"
                                                        : "h-32"
                                                        }`}
                                                >
                                                    <Newspaper size={34} />
                                                </div>
                                            )}

                                            <div className="p-5 flex flex-col">
                                                <div className="flex items-center gap-2 text-[11px] text-gray-400 font-bold mb-3">
                                                    <CalendarDays size={13} />
                                                    {new Date(post.createdAt).toLocaleDateString("es-MX")}
                                                </div>

                                                <p
                                                    className={`text-sm text-gray-700 whitespace-pre-line leading-relaxed ${isFeatured ? "" : "line-clamp-4"
                                                        }`}
                                                >
                                                    {post.content}
                                                </p>

                                                <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeletePost(post.id)}
                                                        disabled={deletingId === post.id}
                                                        className="text-red-400 hover:text-red-600 text-xs font-black flex items-center gap-1 disabled:opacity-50"
                                                    >
                                                        {deletingId === post.id ? (
                                                            <Loader2 className="animate-spin" size={13} />
                                                        ) : (
                                                            <Trash2 size={13} />
                                                        )}
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
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
                                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                        <Newspaper size={20} />
                                    </div>

                                    <div>
                                        <h3 className="font-black text-gray-900">
                                            Nueva publicación
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Agrega un aviso o promoción para tus clientes.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    disabled={saving}
                                    className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 flex items-center justify-center disabled:opacity-50"
                                >
                                    <X size={17} />
                                </button>
                            </div>

                            <form onSubmit={handleCreatePost} className="p-5 space-y-4">
                                <div>
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">
                                        Texto
                                    </label>

                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        className="mt-2 w-full min-h-36 rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
                                        placeholder="Ej. Promoción de fin de semana, nuevo horario, aviso especial..."
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">
                                        Imagen URL opcional
                                    </label>

                                    <div className="relative mt-2">
                                        <ImageIcon
                                            size={16}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                        />

                                        <input
                                            value={imageUrl}
                                            onChange={(e) => setImageUrl(e.target.value)}
                                            className="w-full rounded-2xl border border-gray-200 pl-11 pr-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        disabled={saving}
                                        className="w-full py-3 rounded-2xl bg-gray-100 text-gray-600 text-sm font-black hover:bg-gray-200 disabled:opacity-50 transition-all"
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="w-full py-3 rounded-2xl bg-indigo-600 text-white text-sm font-black hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="animate-spin" size={17} />
                                                Publicando...
                                            </>
                                        ) : (
                                            <>
                                                <Plus size={17} />
                                                Crear publicación
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
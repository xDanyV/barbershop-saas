"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
    Building2,
    ExternalLink,
    ImageIcon,
    Loader2,
    MapPin,
    Phone,
    Save,
    Store,
    ToggleLeft,
    ToggleRight,
} from "lucide-react";
import { usePathname } from "next/navigation";

type BusinessSettings = {
    isServiceActive: boolean;
    maintenanceMessage: string | null;
};

type Business = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    phone: string | null;
    address: string | null;
    logoUrl: string | null;
    coverUrl: string | null;
    settings: BusinessSettings | null;
};

type BusinessForm = {
    name: string;
    description: string;
    phone: string;
    address: string;
    logoUrl: string;
    coverUrl: string;
    isServiceActive: boolean;
    maintenanceMessage: string;
};

export default function MyBusinessPage() {
    const pathname = usePathname();

    const [business, setBusiness] = useState<Business | null>(null);
    const [form, setForm] = useState<BusinessForm>({
        name: "",
        description: "",
        phone: "",
        address: "",
        logoUrl: "",
        coverUrl: "",
        isServiceActive: true,
        maintenanceMessage: "",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const locale = useMemo(() => {
        const match = pathname.match(/^\/(en|es)/);
        return match ? match[1] : "es";
    }, [pathname]);

    const publicUrl = useMemo(() => {
        if (!business) return "";

        if (typeof window === "undefined") {
            return `/${locale}/business/${business.slug}`;
        }

        return `${window.location.origin}/${locale}/business/${business.slug}`;
    }, [business, locale]);

    useEffect(() => {
        const loadBusiness = async () => {
            try {
                const res = await fetch("/api/protected/businesses/me");
                const data = await res.json();

                if (!res.ok) {
                    toast.error(data.error || "No se pudo cargar tu negocio");
                    return;
                }

                setBusiness(data);
                setForm({
                    name: data.name ?? "",
                    description: data.description ?? "",
                    phone: data.phone ?? "",
                    address: data.address ?? "",
                    logoUrl: data.logoUrl ?? "",
                    coverUrl: data.coverUrl ?? "",
                    isServiceActive: data.settings?.isServiceActive ?? true,
                    maintenanceMessage: data.settings?.maintenanceMessage ?? "",
                });
            } catch {
                toast.error("Error al cargar tu negocio");
            } finally {
                setLoading(false);
            }
        };

        loadBusiness();
    }, []);

    const updateField = <K extends keyof BusinessForm>(
        key: K,
        value: BusinessForm[K]
    ) => {
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleCopyPublicUrl = async () => {
        if (!publicUrl) return;

        try {
            await navigator.clipboard.writeText(publicUrl);
            toast.success("Link público copiado");
        } catch {
            toast.error("No se pudo copiar el link");
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        setSaving(true);

        try {
            const res = await fetch("/api/protected/businesses/me", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(form),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || "No se pudo guardar");
                return;
            }

            setBusiness(data);
            toast.success("Negocio actualizado correctamente");
        } catch {
            toast.error("Error al guardar cambios");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <main className="min-h-[70vh] flex items-center justify-center bg-gray-50">
                <div className="flex items-center gap-3 text-gray-500 font-bold text-sm">
                    <Loader2 className="animate-spin" size={18} />
                    Cargando negocio...
                </div>
            </main>
        );
    }

    if (!business) {
        return (
            <main className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md bg-white border border-gray-100 rounded-3xl p-8 text-center shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
                        <Store size={22} />
                    </div>

                    <h1 className="text-xl font-black text-gray-900">
                        No se encontró tu negocio
                    </h1>

                    <p className="text-sm text-gray-500 mt-2">
                        Crea un negocio primero para poder administrar su información.
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-6 md:px-8 md:py-10">
            <div className="max-w-5xl mx-auto space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-end justify-between gap-4"
                >
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black uppercase tracking-widest mb-3">
                            <Store size={14} />
                            Mi negocio
                        </div>

                        <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
                            Configura tu negocio
                        </h1>

                        <p className="text-sm text-gray-500 mt-2 max-w-2xl">
                            Edita la información que verán tus clientes en la página pública de reservas.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                        <button
                            type="button"
                            onClick={handleCopyPublicUrl}
                            className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-xs font-black hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                        >
                            Copiar link público
                        </button>

                        <a
                            href={publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-black hover:bg-indigo-600 transition-all flex items-center justify-center gap-2"
                        >
                            Ver página
                            <ExternalLink size={14} />
                        </a>
                    </div>
                </motion.div>

                <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
                    <motion.section
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="bg-white border border-gray-100 rounded-3xl p-5 md:p-7 shadow-sm space-y-5"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <Building2 size={20} />
                            </div>

                            <div>
                                <h2 className="font-black text-gray-900">
                                    Información básica
                                </h2>
                                <p className="text-xs text-gray-500">
                                    Datos principales de tu negocio.
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest">
                                Nombre del negocio
                            </label>

                            <input
                                value={form.name}
                                onChange={(e) => updateField("name", e.target.value)}
                                className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                placeholder="Barbería El Nuevo Rey"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest">
                                Descripción
                            </label>

                            <textarea
                                value={form.description}
                                onChange={(e) => updateField("description", e.target.value)}
                                className="mt-2 w-full min-h-32 rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
                                placeholder="Describe brevemente tu negocio, estilo, servicios o experiencia."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest">
                                    Teléfono
                                </label>

                                <div className="relative mt-2">
                                    <Phone
                                        size={16}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                    />

                                    <input
                                        value={form.phone}
                                        onChange={(e) => updateField("phone", e.target.value)}
                                        className="w-full rounded-2xl border border-gray-200 pl-11 pr-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                        placeholder="6641234567"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest">
                                    Dirección
                                </label>

                                <div className="relative mt-2">
                                    <MapPin
                                        size={16}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                    />

                                    <input
                                        value={form.address}
                                        onChange={(e) => updateField("address", e.target.value)}
                                        className="w-full rounded-2xl border border-gray-200 pl-11 pr-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                        placeholder="Tijuana, Baja California"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    <div className="space-y-6">
                        <motion.section
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                    <ImageIcon size={20} />
                                </div>

                                <div>
                                    <h2 className="font-black text-gray-900">
                                        Imágenes
                                    </h2>
                                    <p className="text-xs text-gray-500">
                                        Por ahora usa links de imagen.
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest">
                                    Logo URL
                                </label>

                                <input
                                    value={form.logoUrl}
                                    onChange={(e) => updateField("logoUrl", e.target.value)}
                                    className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                    placeholder="https://..."
                                />
                            </div>

                            <div>
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest">
                                    Portada URL
                                </label>

                                <input
                                    value={form.coverUrl}
                                    onChange={(e) => updateField("coverUrl", e.target.value)}
                                    className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                    placeholder="https://..."
                                />
                            </div>
                        </motion.section>

                        <motion.section
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4"
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    updateField("isServiceActive", !form.isServiceActive)
                                }
                                className={`w-full flex items-center justify-between rounded-2xl border p-4 transition-all ${form.isServiceActive
                                        ? "bg-emerald-50 border-emerald-100"
                                        : "bg-red-50 border-red-100"
                                    }`}
                            >
                                <div className="text-left">
                                    <p
                                        className={`text-sm font-black ${form.isServiceActive ? "text-emerald-700" : "text-red-700"
                                            }`}
                                    >
                                        Servicio público
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Activa o pausa las reservas.
                                    </p>
                                </div>

                                {form.isServiceActive ? (
                                    <ToggleRight className="text-emerald-600" size={30} />
                                ) : (
                                    <ToggleLeft className="text-red-500" size={30} />
                                )}
                            </button>

                            <div>
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest">
                                    Mensaje de mantenimiento
                                </label>

                                <textarea
                                    value={form.maintenanceMessage}
                                    onChange={(e) =>
                                        updateField("maintenanceMessage", e.target.value)
                                    }
                                    className="mt-2 w-full min-h-24 rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
                                    placeholder="Ej. Estamos actualizando horarios. Vuelve más tarde."
                                />
                            </div>
                        </motion.section>

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full py-4 rounded-2xl bg-indigo-600 text-white text-sm font-black hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Guardar cambios
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
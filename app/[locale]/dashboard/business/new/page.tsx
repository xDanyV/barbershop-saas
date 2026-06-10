"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
    Building2,
    ImageIcon,
    Loader2,
    MapPin,
    Phone,
    Save,
    Store,
} from "lucide-react";
import { usePathname } from "next/navigation";

type Business = {
    id: string;
    name: string;
    slug: string;
};

type BusinessForm = {
    name: string;
    description: string;
    phone: string;
    address: string;
    logoUrl: string;
    coverUrl: string;
};

export default function CreateBusinessPage() {
    const pathname = usePathname();

    const [existingBusinesses, setExistingBusinesses] = useState<Business[]>([]);
    const [checking, setChecking] = useState(true);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState<BusinessForm>({
        name: "",
        description: "",
        phone: "",
        address: "",
        logoUrl: "",
        coverUrl: "",
    });

    const localePrefix = useMemo(() => {
        const match = pathname.match(/^\/(en|es)/);
        return match ? match[0] : "";
    }, [pathname]);

    useEffect(() => {
        const loadBusinesses = async () => {
            try {
                const res = await fetch("/api/protected/businesses");
                const data = await res.json();

                if (!res.ok) {
                    return;
                }

                if (Array.isArray(data)) {
                    setExistingBusinesses(data);
                }
            } catch {
                // No mostramos error aquí para no bloquear el formulario si solo falla la revisión.
            } finally {
                setChecking(false);
            }
        };

        loadBusinesses();
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (form.name.trim().length < 3) {
            toast.error("El nombre del negocio debe tener al menos 3 caracteres");
            return;
        }

        setSaving(true);

        try {
            const res = await fetch("/api/protected/businesses", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: form.name,
                    description: form.description,
                    phone: form.phone,
                    address: form.address,
                    logoUrl: form.logoUrl,
                    coverUrl: form.coverUrl,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || "No se pudo crear el negocio");
                return;
            }

            toast.success("Negocio creado correctamente");

            await fetch("/api/logout", {
                method: "POST",
            });

            const redirectTo = `${localePrefix}/dashboard/admin/my-business`;
            window.location.href = `${localePrefix}/login?redirectTo=${encodeURIComponent(
                redirectTo
            )}`;
        } catch {
            toast.error("Error al crear el negocio");
        } finally {
            setSaving(false);
        }
    };

    if (checking) {
        return (
            <main className="min-h-[70vh] flex items-center justify-center bg-gray-50">
                <div className="flex items-center gap-3 text-gray-500 font-bold text-sm">
                    <Loader2 className="animate-spin" size={18} />
                    Revisando tu cuenta...
                </div>
            </main>
        );
    }

    if (existingBusinesses.length > 0) {
        const business = existingBusinesses[0];

        return (
            <main className="min-h-screen bg-gray-50 px-4 py-8 md:px-8 md:py-12">
                <div className="max-w-xl mx-auto bg-white border border-gray-100 rounded-3xl p-7 md:p-9 shadow-sm text-center">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-5">
                        <Store size={26} />
                    </div>

                    <h1 className="text-2xl font-black text-gray-900">
                        Ya tienes un negocio creado
                    </h1>

                    <p className="text-sm text-gray-500 mt-3">
                        Actualmente tienes registrado:
                    </p>

                    <p className="mt-3 text-lg font-black text-indigo-600">
                        {business.name}
                    </p>

                    <div className="mt-7 flex flex-col sm:flex-row gap-3">
                        <a
                            href={`${localePrefix}/dashboard/admin/my-business`}
                            className="flex-1 px-4 py-3 rounded-2xl bg-indigo-600 text-white text-sm font-black hover:bg-indigo-700 transition-all"
                        >
                            Ir a Mi negocio
                        </a>

                        <a
                            href={`${localePrefix}/business/${business.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 px-4 py-3 rounded-2xl bg-gray-100 text-gray-700 text-sm font-black hover:bg-gray-200 transition-all"
                        >
                            Ver página pública
                        </a>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-6 md:px-8 md:py-10">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black uppercase tracking-widest mb-3">
                        <Store size={14} />
                        Nuevo negocio
                    </div>

                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
                        Crea tu negocio
                    </h1>

                    <p className="text-sm text-gray-500 mt-2 max-w-2xl">
                        Registra los datos principales de tu barbería para generar tu página pública de reservas.
                    </p>
                </motion.div>

                <form
                    onSubmit={handleSubmit}
                    className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6"
                >
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
                                    Información del negocio
                                </h2>
                                <p className="text-xs text-gray-500">
                                    Estos datos aparecerán en tu perfil público.
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
                                placeholder="Ej. Cortes clásicos, modernos, barba y atención personalizada."
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
                                        Por ahora puedes usar links de imagen.
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

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full py-4 rounded-2xl bg-indigo-600 text-white text-sm font-black hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    Creando negocio...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Crear negocio
                                </>
                            )}
                        </button>

                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                            <p className="text-xs text-amber-800 font-bold leading-relaxed">
                                Después de crear el negocio, deberás iniciar sesión otra vez para actualizar tu rol como dueño.
                            </p>
                        </div>
                    </div>
                </form>
            </div>
        </main>
    );
}
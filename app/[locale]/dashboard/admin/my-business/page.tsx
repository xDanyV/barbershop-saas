"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { ExternalLink, Loader2, Store } from "lucide-react";
import { usePathname } from "next/navigation";
import BusinessProfileForm, {
    type BusinessForm,
} from "./_components/BusinessProfileForm";
import BusinessPostsManager from "./_components/BusinessPostsManager";
import BusinessGalleryManager from "./_components/BusinessGalleryManager";
import MyBusinessTabs, {
    type BusinessTab,
} from "./_components/MyBusinessTabs";

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

    const [activeTab, setActiveTab] = useState<BusinessTab>("profile");
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

    const handleSave = async (e: FormEvent<HTMLFormElement>) => {
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
        <main className="min-h-screen bg-gray-50 px-4 pt-6 pb-32 md:px-8 md:py-10">
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
                            Edita la información, publicaciones y galería que verán tus clientes en la página pública.
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

                <MyBusinessTabs
                    activeTab={activeTab}
                    onChange={setActiveTab}
                />

                {activeTab === "profile" && (
                    <BusinessProfileForm
                        form={form}
                        saving={saving}
                        onSubmit={handleSave}
                        onUpdateField={updateField}
                    />
                )}

                {activeTab === "posts" && (
                    <div className="w-full">
                        <BusinessPostsManager />
                    </div>
                )}

                {activeTab === "gallery" && (
                    <div className="max-w-4xl">
                        <BusinessGalleryManager />
                    </div>
                )}
            </div>
        </main>
    );
}
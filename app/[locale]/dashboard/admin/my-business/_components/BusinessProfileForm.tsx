"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import {
    Building2,
    ImageIcon,
    Loader2,
    MapPin,
    Phone,
    Save,
    ToggleLeft,
    ToggleRight,
    Trash2,
    UploadCloud,
} from "lucide-react";
import toast from "react-hot-toast";
import { useUploadThing } from "@/lib/uploadthing";

export type BusinessForm = {
    name: string;
    description: string;
    phone: string;
    address: string;
    logoUrl: string;
    coverUrl: string;
    isServiceActive: boolean;
    maintenanceMessage: string;
};

type UpdateBusinessField = <K extends keyof BusinessForm>(
    key: K,
    value: BusinessForm[K]
) => void;

type Props = {
    form: BusinessForm;
    saving: boolean;
    onSubmit: (e: FormEvent<HTMLFormElement>) => void;
    onUpdateField: UpdateBusinessField;
};

type ImageField = "logoUrl" | "coverUrl";

export default function BusinessProfileForm({
    form,
    saving,
    onSubmit,
    onUpdateField,
}: Props) {
    const [uploadingField, setUploadingField] = useState<ImageField | null>(null);

    const { startUpload: startLogoUpload } = useUploadThing("businessLogoImage", {
        onClientUploadComplete: (res) => {
            const uploadedUrl = res?.[0]?.serverData?.url ?? res?.[0]?.url;

            if (!uploadedUrl) {
                toast.error("No se pudo obtener la URL del logo");
                setUploadingField(null);
                return;
            }

            onUpdateField("logoUrl", uploadedUrl);
            toast.success("Logo subido. Guarda los cambios para aplicarlo.");
            setUploadingField(null);
        },
        onUploadError: (error) => {
            console.error("Logo upload error:", error);
            toast.error(error.message || "No se pudo subir el logo");
            setUploadingField(null);
        },
    });

    const { startUpload: startCoverUpload } = useUploadThing("businessCoverImage", {
        onClientUploadComplete: (res) => {
            const uploadedUrl = res?.[0]?.serverData?.url ?? res?.[0]?.url;

            if (!uploadedUrl) {
                toast.error("No se pudo obtener la URL de la portada");
                setUploadingField(null);
                return;
            }

            onUpdateField("coverUrl", uploadedUrl);
            toast.success("Portada subida. Guarda los cambios para aplicarla.");
            setUploadingField(null);
        },
        onUploadError: (error) => {
            console.error("Cover upload error:", error);
            toast.error(error.message || "No se pudo subir la portada");
            setUploadingField(null);
        },
    });

    const handleUploadSelected = async (
        field: ImageField,
        event: ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];

        event.target.value = "";

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Selecciona una imagen válida");
            return;
        }

        const maxSizeInMb = field === "logoUrl" ? 2 : 8;
        const maxSizeInBytes = maxSizeInMb * 1024 * 1024;

        if (file.size > maxSizeInBytes) {
            toast.error(`La imagen no debe pesar más de ${maxSizeInMb}MB`);
            return;
        }

        setUploadingField(field);

        if (field === "logoUrl") {
            await startLogoUpload([file]);
            return;
        }

        await startCoverUpload([file]);
    };

    const isUploadingLogo = uploadingField === "logoUrl";
    const isUploadingCover = uploadingField === "coverUrl";
    const isUploadingAnyImage = uploadingField !== null;

    return (
        <form
            onSubmit={onSubmit}
            className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6"
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
                        onChange={(e) => onUpdateField("name", e.target.value)}
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
                        onChange={(e) => onUpdateField("description", e.target.value)}
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
                                onChange={(e) => onUpdateField("phone", e.target.value)}
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
                                onChange={(e) => onUpdateField("address", e.target.value)}
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
                            <h2 className="font-black text-gray-900">Imágenes</h2>
                            <p className="text-xs text-gray-500">
                                Sube el logo y la portada pública.
                            </p>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-black text-gray-900">
                                    Logo
                                </p>
                                <p className="text-[11px] font-bold text-gray-400">
                                    Imagen cuadrada recomendada. Máximo 2MB.
                                </p>
                            </div>

                            {form.logoUrl && (
                                <button
                                    type="button"
                                    onClick={() => onUpdateField("logoUrl", "")}
                                    className="text-red-400 hover:text-red-600"
                                    title="Quitar logo"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-16 h-16 rounded-3xl bg-white border border-gray-100 overflow-hidden flex items-center justify-center text-gray-300 shrink-0">
                                {form.logoUrl ? (
                                    <img
                                        src={form.logoUrl}
                                        alt="Logo del negocio"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <ImageIcon size={22} />
                                )}
                            </div>

                            <div className="flex-1">
                                <input
                                    id="business-logo-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    disabled={isUploadingAnyImage}
                                    onChange={(event) =>
                                        handleUploadSelected("logoUrl", event)
                                    }
                                />

                                <label
                                    htmlFor="business-logo-upload"
                                    className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-xs font-black text-white shadow-sm shadow-indigo-100 transition-all ${isUploadingAnyImage
                                            ? "opacity-50 pointer-events-none cursor-not-allowed"
                                            : "hover:bg-indigo-500 cursor-pointer"
                                        }`}
                                >
                                    {isUploadingLogo ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <UploadCloud size={16} />
                                    )}

                                    {isUploadingLogo
                                        ? "Subiendo..."
                                        : form.logoUrl
                                            ? "Cambiar logo"
                                            : "Subir logo"}
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-black text-gray-900">
                                    Portada
                                </p>
                                <p className="text-[11px] font-bold text-gray-400">
                                    Imagen horizontal recomendada. Máximo 8MB.
                                </p>
                            </div>

                            {form.coverUrl && (
                                <button
                                    type="button"
                                    onClick={() => onUpdateField("coverUrl", "")}
                                    className="text-red-400 hover:text-red-600"
                                    title="Quitar portada"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>

                        <div className="rounded-3xl bg-white border border-gray-100 overflow-hidden h-32 flex items-center justify-center text-gray-300">
                            {form.coverUrl ? (
                                <img
                                    src={form.coverUrl}
                                    alt="Portada del negocio"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <ImageIcon size={24} />
                            )}
                        </div>

                        <input
                            id="business-cover-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={isUploadingAnyImage}
                            onChange={(event) =>
                                handleUploadSelected("coverUrl", event)
                            }
                        />

                        <label
                            htmlFor="business-cover-upload"
                            className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-xs font-black text-white shadow-sm shadow-indigo-100 transition-all ${isUploadingAnyImage
                                    ? "opacity-50 pointer-events-none cursor-not-allowed"
                                    : "hover:bg-indigo-500 cursor-pointer"
                                }`}
                        >
                            {isUploadingCover ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <UploadCloud size={16} />
                            )}

                            {isUploadingCover
                                ? "Subiendo..."
                                : form.coverUrl
                                    ? "Cambiar portada"
                                    : "Subir portada"}
                        </label>
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
                            onUpdateField("isServiceActive", !form.isServiceActive)
                        }
                        className={`w-full flex items-center justify-between rounded-2xl border p-4 transition-all ${form.isServiceActive
                                ? "bg-emerald-50 border-emerald-100"
                                : "bg-red-50 border-red-100"
                            }`}
                    >
                        <div className="text-left">
                            <p
                                className={`text-sm font-black ${form.isServiceActive
                                        ? "text-emerald-700"
                                        : "text-red-700"
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
                                onUpdateField("maintenanceMessage", e.target.value)
                            }
                            className="mt-2 w-full min-h-24 rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
                            placeholder="Ej. Estamos actualizando horarios. Vuelve más tarde."
                        />
                    </div>
                </motion.section>

                <button
                    type="submit"
                    disabled={saving || isUploadingAnyImage}
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
    );
}
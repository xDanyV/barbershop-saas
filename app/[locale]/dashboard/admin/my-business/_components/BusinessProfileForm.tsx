"use client";

import type { FormEvent } from "react";
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
} from "lucide-react";

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

export default function BusinessProfileForm({
    form,
    saving,
    onSubmit,
    onUpdateField,
}: Props) {
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
                            onChange={(e) => onUpdateField("logoUrl", e.target.value)}
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
                            onChange={(e) => onUpdateField("coverUrl", e.target.value)}
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
    );
}
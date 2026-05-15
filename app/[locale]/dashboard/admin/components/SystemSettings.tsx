"use client";

import { useEffect, useState } from "react";
import { Power, Settings as SettingsIcon, AlertTriangle, Save } from "lucide-react";
import { toast } from "react-hot-toast";

export default function SystemSettings() {
    const [isActive, setIsActive] = useState(true);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/settings");
            if (res.ok) {
                const data = await res.json();
                setIsActive(data.isServiceActive);
                setMessage(data.maintenanceMessage || "");
            } else {
                toast.error("Error al cargar la configuración");
            }
        } catch (err) {
            console.error("Fetch error:", err);
            toast.error("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleSave = async () => {
        if (!isActive && !message.trim()) {
            return toast.error("Debes escribir un mensaje de mantenimiento si vas a apagar el servicio.");
        }

        const loadingToast = toast.loading("Guardando configuración...");
        setSaving(true);

        try {
            const res = await fetch("/api/admin/settings", {
                method: "PATCH",
                body: JSON.stringify({
                    isServiceActive: isActive,
                    maintenanceMessage: message
                }),
            });

            if (res.ok) {
                toast.success("Configuración global actualizada", { id: loadingToast });
            } else {
                toast.error("Error al guardar los cambios", { id: loadingToast });
            }
        } catch (err) {
            console.error("Save error:", err);
            toast.error("Error de conexión", { id: loadingToast });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center font-bold text-gray-400">Cargando configuración...</div>;

    return (
        <div className="space-y-6 max-w-3xl">
            <div className={`border-2 p-6 md:p-8 rounded-4xl transition-all duration-300 ${isActive ? "bg-white border-green-100 shadow-sm" : "bg-red-50/50 border-red-200 shadow-lg shadow-red-100/50"
                }`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${isActive ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                            }`}>
                            <Power size={28} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900">Estado del Sistema</h2>
                            <p className={`font-bold text-sm mt-0.5 ${isActive ? "text-green-600" : "text-red-500"}`}>
                                {isActive ? "🟢 Servicio Abierto y Operativo" : "🔴 Servicio Cerrado (Mantenimiento)"}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsActive(!isActive)}
                        className={`relative inline-flex h-10 w-20 items-center rounded-full transition-colors focus:outline-none ${isActive ? 'bg-green-500' : 'bg-red-500'
                            }`}
                    >
                        <span className={`inline-block h-8 w-8 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-11' : 'translate-x-1'
                            } shadow-md`} />
                    </button>
                </div>

                <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                        <AlertTriangle size={16} className={isActive ? "text-gray-400" : "text-amber-500"} />
                        Mensaje para los clientes (Visible si está apagado)
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Ej: Estamos realizando mejoras en el sistema. Volveremos a las 5:00 PM."
                        rows={3}
                        className={`w-full p-4 border rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 transition-all resize-none ${isActive
                                ? "bg-gray-50 border-gray-200 text-gray-500 focus:ring-indigo-500/20 focus:border-indigo-500"
                                : "bg-white border-red-200 text-gray-900 focus:ring-red-500/20 focus:border-red-500"
                            }`}
                    />
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-8 py-3.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-indigo-600 transition-all shadow-lg shadow-gray-200 disabled:opacity-50"
                >
                    <Save size={18} />
                    {saving ? "Guardando..." : "Guardar Configuración"}
                </button>
            </div>
        </div>
    );
}
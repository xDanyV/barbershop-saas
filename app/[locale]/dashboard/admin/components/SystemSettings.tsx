"use client";

import { useEffect, useState } from "react";
import { Power, AlertTriangle, Save } from "lucide-react";
import { toast } from "react-hot-toast";
import { useTranslations } from "next-intl";

export default function SystemSettings() {
    const t = useTranslations("SystemSettings");
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
                toast.error(t("errors.fetch"));
            }
        } catch (err) {
            console.error("Fetch error:", err);
            toast.error(t("errors.connection"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleSave = async () => {
        if (!isActive && !message.trim()) {
            return toast.error(t("errors.emptyMessage"));
        }

        const loadingToast = toast.loading(t("toasts.saving"));
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
                toast.success(t("toasts.success"), { id: loadingToast });
            } else {
                toast.error(t("errors.save"), { id: loadingToast });
            }
        } catch (err) {
            console.error("Save error:", err);
            toast.error(t("errors.connection"), { id: loadingToast });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center font-bold text-gray-400">{t("loading")}</div>;

    return (
        // Agregamos pb-24 para móviles y lo removemos en escritorio
        <div className="space-y-6 max-w-3xl pb-24 md:pb-0">
            <div className={`border-2 p-6 md:p-8 rounded-4xl transition-all duration-300 ${isActive ? "bg-white border-green-100 shadow-sm" : "bg-red-50/50 border-red-200 shadow-lg shadow-red-100/50"
                }`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors shrink-0 ${isActive ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                            }`}>
                            <Power size={28} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900">{t("systemState.title")}</h2>
                            <p className={`font-bold text-sm mt-0.5 ${isActive ? "text-green-600" : "text-red-500"}`}>
                                {isActive ? t("systemState.active") : t("systemState.inactive")}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsActive(!isActive)}
                        className={`relative inline-flex h-10 w-20 shrink-0 items-center rounded-full transition-colors focus:outline-none ${isActive ? 'bg-green-500' : 'bg-red-500'
                            }`}
                    >
                        <span className={`inline-block h-8 w-8 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-11' : 'translate-x-1'
                            } shadow-md`} />
                    </button>
                </div>

                <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                        <AlertTriangle size={16} className={isActive ? "text-gray-400" : "text-amber-500"} />
                        {t("message.label")}
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={t("message.placeholder")}
                        rows={3}
                        className={`w-full p-4 border rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 transition-all resize-none ${isActive
                            ? "bg-gray-50 border-gray-200 text-gray-500 focus:ring-indigo-500/20 focus:border-indigo-500"
                            : "bg-white border-red-200 text-gray-900 focus:ring-red-500/20 focus:border-red-500"
                            }`}
                    />
                </div>
            </div>

            <div className="flex justify-end">
                {/* Botón ajustado a w-full en móvil y w-auto en escritorio */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex w-full md:w-auto items-center justify-center gap-2 px-8 py-3.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-indigo-600 transition-all shadow-lg shadow-gray-200 disabled:opacity-50"
                >
                    <Save size={18} />
                    {saving ? t("button.saving") : t("button.save")}
                </button>
            </div>
        </div>
    );
}
"use client";

import { motion } from "framer-motion";
import { Clock, ShieldCheck, LogOut } from "lucide-react";
// Usamos el router específico de i18n que creaste para no perder el idioma en la redirección
import { useRouter } from "../../../../i18n/routing";
import { useTranslations } from "next-intl";

export default function PendingApproval() {
    const t = useTranslations("PendingApproval");
    const router = useRouter();

    const handleLogout = async () => {
        // Aquí llamas a tu lógica de logout actual
        await fetch("/api/logout", { method: "POST" });
        router.push("/login");
    };

    return (
        <div className="fixed inset-0 z-50 bg-white flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full text-center space-y-8"
            >
                {/* Icono Animado */}
                <div className="relative w-24 h-24 mx-auto">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border-4 border-dashed border-indigo-100 rounded-full"
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
                        <Clock size={40} className="animate-pulse" />
                    </div>
                </div>

                <div className="space-y-3">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                        {t("title")}
                    </h1>
                    <p className="text-gray-500 font-medium leading-relaxed">
                        {t("description")}
                    </p>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6 flex items-start gap-4 text-left">
                    <div className="bg-white p-2 rounded-xl shadow-sm text-indigo-600 shrink-0">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <h4 className="text-indigo-900 font-bold text-sm">{t("securityTitle")}</h4>
                        <p className="text-indigo-700/70 text-xs mt-1 leading-relaxed">
                            {t("securityDesc")}
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 mx-auto text-gray-400 hover:text-gray-600 font-bold text-sm transition-colors py-2"
                >
                    <LogOut size={18} />
                    {t("logoutButton")}
                </button>
            </motion.div>
        </div>
    );
}
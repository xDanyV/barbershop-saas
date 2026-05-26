"use client";

import { Ban, Mail, LogOut, Home } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRouter } from "../../../../../i18n/routing";

export default function BannedCustomerScreen() {
    const t = useTranslations("BannedCustomerScreen");
    const router = useRouter();

    const handleLogout = async () => {
        await fetch("/api/logout", { method: "POST" });
        router.replace("/login");
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="max-w-md w-full bg-white rounded-[3rem] p-8 md:p-10 shadow-2xl text-center border border-red-100"
            >
                <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-red-100">
                    <Ban size={48} strokeWidth={2.5} />
                </div>

                <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
                    {t("title")}
                </h1>

                <div className="inline-block px-3 py-1 bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-widest rounded-full mb-6">
                    {t("subtitle")}
                </div>

                <p className="text-sm text-gray-500 font-medium leading-relaxed mb-8">
                    {t("message")}
                </p>

                <div className="space-y-3">
                    <button
                        onClick={() => router.push("/")}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-gray-200"
                    >
                        <Home size={18} />
                        {t("home")}
                    </button>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-sm transition-colors border border-red-100"
                    >
                        <LogOut size={18} />
                        {t("logout")}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
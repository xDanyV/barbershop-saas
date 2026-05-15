"use client";

import { motion } from "framer-motion";
import { Clock, ShieldCheck, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PendingApproval() {
    const router = useRouter();

    const handleLogout = async () => {
        // Aquí llamas a tu lógica de logout actual
        await fetch("/api/logout", { method: "POST" });
        router.push("/login");
    };

    return (
        <div className="fixed inset-0 z-100 bg-white flex items-center justify-center p-6">
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
                        Account Under Review
                    </h1>
                    <p className="text-gray-500 font-medium leading-relaxed">
                        Welcome to the team! Our administrator is currently verifying your profile.
                        This usually takes less than 24 hours.
                    </p>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6 flex items-start gap-4 text-left">
                    <div className="bg-white p-2 rounded-xl shadow-sm text-indigo-600 shrink-0">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <h4 className="text-indigo-900 font-bold text-sm">Security first</h4>
                        <p className="text-indigo-700/70 text-xs mt-1 leading-relaxed">
                            We verify every professional to maintain the quality of our service.
                            You will gain access to your schedule once approved.
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 mx-auto text-gray-400 hover:text-gray-600 font-bold text-sm transition-colors py-2"
                >
                    <LogOut size={18} />
                    Log out and check later
                </button>
            </motion.div>
        </div>
    );
}
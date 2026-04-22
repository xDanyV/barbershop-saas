"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Toaster, toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, CalendarDays, Scissors, Users, BookOpen } from "lucide-react";

export default function DashboardNavbar({ role }: { role: string }) {
    const router = useRouter();
    const pathname = usePathname();

    const menuItems = role === "BARBER"
        ? [
            { name: "Mis Citas", path: "/dashboard/barber", icon: CalendarDays },
            { name: "Catálogo", path: "/dashboard/barber/catalog", icon: Scissors },
        ]
        : [
            { name: "Mis Citas", path: "/dashboard/customer/home", icon: CalendarDays },
            { name: "Reservar", path: "/dashboard/customer/barbers", icon: BookOpen },
        ];

    const handleLogout = async () => {
        await fetch("/api/logout", { method: "POST" });
        router.push("/login");
    };

    const handleNavigation = async (path: string) => {
        if (role === "CUSTOMER" && path === "/dashboard/customer/barbers") {
            try {
                const response = await fetch("/api/protected/appointments/user");
                const data = await response.json();

                if (Array.isArray(data)) {
                    const activeCount = data.filter(
                        (a: any) => a.status === "PENDING" || a.status === "CONFIRMED"
                    ).length;

                    if (activeCount >= 2) {
                        toast.error("Máximo 2 citas activas permitidas.", {
                            id: "limit",
                            icon: "🚫",
                            style: {
                                borderRadius: "8px",
                                background: "#FFFFFF",
                                color: "#1e293b",
                                border: "1px solid #e2e8f0",
                                fontSize: "14px",
                            },
                        });
                        return;
                    }
                }
            } catch (error) {
                console.error("Error checking appointments:", error);
            }
        }
        router.push(path);
    };

    return (
        <>
            {/* ── Desktop Navbar (top) ── */}
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="hidden md:flex bg-indigo-950 text-white px-8 py-3 justify-between items-center shadow-lg border-b border-indigo-800/50 sticky top-0 z-50"
            >
                {/* Logo + nav */}
                <div className="flex items-center gap-10">
                    <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => router.push(role === "BARBER" ? "/dashboard/barber" : "/dashboard/customer/home")}
                    >
                        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold shadow-inner shrink-0">
                            B
                        </div>
                        <h1 className="text-base font-bold tracking-tighter uppercase">
                            Barber<span className="text-indigo-400">SaaS</span>
                        </h1>
                    </div>

                    <nav className="flex gap-1">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.path;
                            return (
                                <button
                                    key={item.path}
                                    onClick={() => handleNavigation(item.path)}
                                    className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 rounded-md
                                        ${isActive ? "text-white" : "text-indigo-300 hover:text-white hover:bg-white/5"}`}
                                >
                                    {item.name}
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTabDesktop"
                                            className="absolute bottom-0 left-2 right-2 h-0.5 bg-indigo-400 rounded-full"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Logout */}
                <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-xs font-semibold bg-white/10 hover:bg-red-500/20 hover:text-red-300 border border-white/10 hover:border-red-500/50 px-4 py-2 rounded-lg transition-all"
                >
                    <LogOut size={14} />
                    Cerrar Sesión
                </motion.button>
            </motion.header>

            {/* ── Mobile Top Bar (logo only) ── */}
            <motion.header
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="md:hidden bg-indigo-950 text-white px-5 py-3 flex justify-between items-center border-b border-indigo-800/50 sticky top-0 z-50"
            >
                <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => router.push(role === "BARBER" ? "/dashboard/barber" : "/dashboard/customer/home")}
                >
                    <div className="w-7 h-7 bg-indigo-500 rounded-md flex items-center justify-center font-bold text-sm shrink-0">
                        B
                    </div>
                    <h1 className="text-sm font-bold tracking-tighter uppercase">
                        Barber<span className="text-indigo-400">SaaS</span>
                    </h1>
                </div>

                <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 hover:text-red-300 transition-colors"
                >
                    <LogOut size={15} />
                </motion.button>
            </motion.header>

            {/* ── Mobile Bottom Nav ── */}
            <motion.nav
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1, type: "spring", stiffness: 200, damping: 25 }}
                className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-indigo-950/95 backdrop-blur-xl border-t border-indigo-800/50 px-6 pb-safe"
            >
                <div className="flex items-center justify-around py-2">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.path;
                        const Icon = item.icon;

                        return (
                            <button
                                key={item.path}
                                onClick={() => handleNavigation(item.path)}
                                className="flex flex-col items-center gap-1 px-5 py-2 relative"
                            >
                                {/* Active pill background */}
                                <AnimatePresence>
                                    {isActive && (
                                        <motion.div
                                            layoutId="activePill"
                                            className="absolute inset-0 bg-indigo-500/20 rounded-2xl"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                </AnimatePresence>

                                <motion.div
                                    animate={{
                                        scale: isActive ? 1.1 : 1,
                                        y: isActive ? -1 : 0,
                                    }}
                                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                >
                                    <Icon
                                        size={22}
                                        className={`transition-colors duration-200 ${isActive ? "text-indigo-300" : "text-indigo-500"}`}
                                        strokeWidth={isActive ? 2.5 : 1.8}
                                    />
                                </motion.div>

                                <span className={`text-[10px] font-bold transition-colors duration-200 ${isActive ? "text-indigo-300" : "text-indigo-500/70"}`}>
                                    {item.name}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </motion.nav>

            {/* Spacer so content doesn't hide behind bottom nav on mobile */}
            <div className="md:hidden h-20" />

            <Toaster position="top-right" />
        </>
    );
}
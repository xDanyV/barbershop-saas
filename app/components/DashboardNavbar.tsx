"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Toaster, toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut } from "lucide-react"; // Usaremos iconos para ahorrar espacio

export default function DashboardNavbar({ role }: { role: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const menuItems = role === "BARBER"
        ? [
            { name: "Mis Citas", path: "/dashboard/barber" },
            { name: "Catálogo", path: "/dashboard/barber/catalog" },
        ]
        : [
            { name: "Mis Citas", path: "/dashboard/customer/home" },
            { name: "Reservar", path: "/dashboard/customer/barbers" },
        ];

    const handleLogout = async () => {
        await fetch("/api/logout", { method: "POST" });
        router.push("/login");
    };

    const handleNavigation = async (path: string) => {
        setIsMenuOpen(false); // Cerramos el menú al navegar
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
                            icon: '🚫',
                            style: {
                                borderRadius: '8px',
                                background: '#FFFFFF',
                                color: '#1e293b',
                                border: '1px solid #e2e8f0',
                                fontSize: '14px',
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
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-indigo-950 text-white px-4 sm:px-8 py-3 flex justify-between items-center shadow-lg border-b border-indigo-800/50 sticky top-0 z-50"
            >
                {/* Logo y Menú Desktop */}
                <div className="flex items-center gap-4 sm:gap-12">
                    <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => router.push(role === "BARBER" ? "/dashboard/barber" : "/dashboard/customer/home")}
                    >
                        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold shadow-inner flex-shrink-0">
                            B
                        </div>
                        <h1 className="text-base sm:text-lg font-bold tracking-tighter uppercase">
                            Barber<span className="text-indigo-400">SaaS</span>
                        </h1>
                    </div>

                    {/* Menú visible solo en Desktop (sm y superior) */}
                    <nav className="hidden md:flex gap-1">
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
                                            layoutId="activeTab"
                                            className="absolute bottom-0 left-2 right-2 h-0.5 bg-indigo-400 rounded-full"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Acciones y Botón Mobile */}
                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Botón Logout Desktop */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleLogout}
                        className="hidden sm:flex items-center gap-2 text-xs font-semibold bg-white/10 hover:bg-red-500/20 hover:text-red-300 border border-white/10 hover:border-red-500/50 px-4 py-2 rounded-lg transition-all"
                    >
                        Cerrar Sesión
                    </motion.button>

                    {/* Botón Hamburguesa Mobile */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden p-2 text-indigo-300 hover:text-white"
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Menú Mobile (AnimatePresence para animar entrada/salida) */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="absolute top-full left-0 right-0 bg-indigo-900 border-b border-indigo-800 md:hidden flex flex-col p-4 gap-2"
                        >
                            {menuItems.map((item) => (
                                <button
                                    key={item.path}
                                    onClick={() => handleNavigation(item.path)}
                                    className={`px-4 py-3 text-left rounded-lg text-sm font-medium ${pathname === item.path ? "bg-indigo-500 text-white" : "text-indigo-200"
                                        }`}
                                >
                                    {item.name}
                                </button>
                            ))}
                            <hr className="border-indigo-800 my-1" />
                            <button
                                onClick={handleLogout}
                                className="px-4 py-3 text-left text-red-400 text-sm font-bold flex items-center gap-2"
                            >
                                <LogOut size={16} /> Cerrar Sesión
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.header>
            <Toaster position="top-right" />
        </>
    );
}
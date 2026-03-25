"use client";

import { useRouter, usePathname } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";

export default function DashboardNavbar({ role }: { role: string }) {
    const router = useRouter();
    const pathname = usePathname();

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

    return (
        <>
            <motion.header 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-indigo-950 text-white px-8 py-3 flex justify-between items-center shadow-lg border-b border-indigo-800/50 sticky top-0 z-50"
            >
                <div className="flex items-center gap-12">
                    <div 
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => router.push("/dashboard/customer/home")}
                    >
                        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold shadow-inner">
                            B
                        </div>
                        <h1 className="text-lg font-bold tracking-tighter uppercase">
                            Barber<span className="text-indigo-400">SaaS</span>
                        </h1>
                    </div>

                    <nav className="flex gap-1">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.path;
                            return (
                                <button
                                    key={item.path}
                                    onClick={() => router.push(item.path)}
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

                <div className="flex items-center gap-4">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleLogout}
                        className="text-xs font-semibold bg-white/10 hover:bg-red-500/20 hover:text-red-300 border border-white/10 hover:border-red-500/50 px-4 py-2 rounded-lg transition-all"
                    >
                        Cerrar Sesión
                    </motion.button>
                </div>
            </motion.header>
            <Toaster position="top-right" />
        </>
    );
}
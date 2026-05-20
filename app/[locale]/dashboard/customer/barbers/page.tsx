"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Phone, ArrowRight, Scissors } from "lucide-react";
import { useTranslations } from "next-intl";

type Barber = {
    id: string;
    user: { name: string | null; email: string; phone: string };
};

export default function BarbersPage() {
    const t = useTranslations("BarbersPage");
    const router = useRouter();
    const [barbers, setBarbers] = useState<Barber[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/barbers")
            .then((res) => res.json())
            .then((data: Barber[]) => setBarbers(data))
            .catch(() => console.error("Could not load barbers"))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
            <header className="mb-8 md:mb-12 text-center md:text-left">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-center md:justify-start gap-2 text-indigo-600 font-bold tracking-widest uppercase text-[10px] md:text-xs mb-3"
                >
                    <Scissors size={14} />
                    <span>{t("eyebrow")}</span>
                </motion.div>
                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight"
                >
                    {t("title")}
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-gray-500 mt-3 text-base md:text-lg font-medium"
                >
                    {t("subtitle")}
                </motion.p>
            </header>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-4xl md:rounded-[2.5rem] p-6 md:p-8 animate-pulse shadow-sm">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-100" />
                                <div className="h-5 bg-gray-100 rounded w-3/4 mx-auto" />
                                <div className="h-4 bg-gray-100 rounded w-1/2 mx-auto" />
                                <div className="h-12 bg-gray-100 rounded-2xl w-full mt-4" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : barbers.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16 md:py-20 bg-gray-50 rounded-[2.5rem] md:rounded-[3rem] border border-dashed border-gray-200 px-6"
                >
                    <User className="mx-auto text-gray-300 mb-4" size={48} />
                    <p className="text-gray-500 font-bold text-xl">{t("empty.title")}</p>
                    <p className="text-gray-400 text-sm">{t("empty.subtitle")}</p>
                </motion.div>
            ) : (
                <motion.div
                    initial="hidden"
                    animate="show"
                    variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
                >
                    {barbers.map((barber) => {
                        const initials = barber.user.name
                            ? barber.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                            : "B";

                        return (
                            <motion.div
                                key={barber.id}
                                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                                whileHover={{ y: window.innerWidth > 768 ? -8 : 0 }}
                                className="group relative bg-white border border-gray-100 rounded-4xl md:rounded-[2.5rem] p-6 md:p-8 shadow-sm hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-300 overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-5 md:opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                                    <Scissors size={60} className="md:size-20 -rotate-12" />
                                </div>

                                <div className="flex flex-col items-center text-center relative z-10">
                                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-4xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 md:mb-5 shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform duration-300">
                                        <span className="text-white font-black text-xl md:text-2xl tracking-tighter">{initials}</span>
                                    </div>

                                    <div className="mb-6">
                                        <h3 className="font-black text-gray-900 text-lg md:text-xl tracking-tight mb-1 truncate max-w-50">
                                            {barber.user.name ?? t("fallbackName")}
                                        </h3>
                                        <div className="flex items-center justify-center gap-1.5 text-gray-400 font-bold text-[10px] md:text-xs uppercase tracking-widest">
                                            <Phone size={12} className="text-indigo-400" />
                                            {barber.user.phone}
                                        </div>
                                    </div>

                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => router.push(`/dashboard/customer?barberId=${barber.id}`)}
                                        className="w-full py-3.5 md:py-4 rounded-xl md:rounded-[1.25rem] bg-gray-900 text-white text-xs md:text-sm font-black uppercase tracking-widest hover:bg-indigo-600 shadow-xl shadow-gray-200 hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2 group-hover:gap-4"
                                    >
                                        {t("selectBarber")}
                                        <ArrowRight size={18} />
                                    </motion.button>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}
        </div>
    );
}
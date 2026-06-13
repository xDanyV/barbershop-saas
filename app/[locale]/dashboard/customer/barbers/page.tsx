"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    ArrowRight,
    Building2,
    CalendarDays,
    Loader2,
    MapPin,
    Phone,
    Scissors,
    Store,
} from "lucide-react";

type Business = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    phone: string | null;
    address: string | null;
    logoUrl: string | null;
    coverUrl: string | null;
    barberCount: number;
    serviceCount: number;
    settings: {
        isServiceActive: boolean;
        maintenanceMessage: string | null;
    } | null;
};

export default function BusinessesPage() {
    const router = useRouter();
    const pathname = usePathname();

    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [loading, setLoading] = useState(true);

    const localePrefix = useMemo(() => {
        const match = pathname.match(/^\/(en|es)/);
        return match ? match[0] : "";
    }, [pathname]);

    useEffect(() => {
        fetch("/api/businesses")
            .then((res) => res.json())
            .then((data: Business[]) => {
                if (Array.isArray(data)) {
                    setBusinesses(data);
                }
            })
            .catch(() => console.error("Could not load businesses"))
            .finally(() => setLoading(false));
    }, []);

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((word) => word[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="pb-24 md:pb-0 md:p-8 max-w-6xl mx-auto">
            <header className="mb-8 md:mb-12 text-center md:text-left">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-center md:justify-start gap-2 text-indigo-600 font-bold tracking-widest uppercase text-[10px] md:text-xs mb-3"
                >
                    <Store size={14} />
                    <span>Available Businesses</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight"
                >
                    Choose a Barbershop
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-gray-500 mt-3 text-base md:text-lg font-medium max-w-2xl mx-auto md:mx-0"
                >
                    Browse registered businesses and book your appointment with the team that fits your style.
                </motion.p>
            </header>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div
                            key={i}
                            className="bg-white border border-gray-100 rounded-4xl md:rounded-[2.5rem] overflow-hidden animate-pulse shadow-sm"
                        >
                            <div className="h-32 bg-gray-100" />
                            <div className="p-6 space-y-4">
                                <div className="w-16 h-16 rounded-2xl bg-gray-100" />
                                <div className="h-5 bg-gray-100 rounded w-3/4" />
                                <div className="h-4 bg-gray-100 rounded w-full" />
                                <div className="h-4 bg-gray-100 rounded w-2/3" />
                                <div className="h-12 bg-gray-100 rounded-2xl w-full mt-4" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : businesses.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16 md:py-20 bg-gray-50 rounded-[2.5rem] md:rounded-[3rem] border border-dashed border-gray-200 px-6"
                >
                    <Building2 className="mx-auto text-gray-300 mb-4" size={48} />
                    <p className="text-gray-500 font-bold text-xl">
                        No businesses available
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                        Registered barbershops will appear here.
                    </p>
                </motion.div>
            ) : (
                <motion.div
                    initial="hidden"
                    animate="show"
                    variants={{
                        hidden: { opacity: 0 },
                        show: {
                            opacity: 1,
                            transition: { staggerChildren: 0.08 },
                        },
                    }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
                >
                    {businesses.map((business) => {
                        const isServiceActive =
                            business.settings?.isServiceActive ?? true;

                        return (
                            <motion.div
                                key={business.id}
                                variants={{
                                    hidden: { opacity: 0, y: 20 },
                                    show: { opacity: 1, y: 0 },
                                }}
                                whileHover={{ y: 0 }}
                                className="group relative bg-white border border-gray-100 rounded-4xl md:rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-300 overflow-hidden"
                            >
                                <div className="relative h-32 md:h-36 bg-linear-to-br from-indigo-950 via-indigo-900 to-purple-900 overflow-hidden">
                                    {business.coverUrl ? (
                                        <img
                                            src={business.coverUrl}
                                            alt={business.name}
                                            className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 opacity-20">
                                            <div className="absolute -right-8 -top-8">
                                                <Scissors size={120} className="-rotate-12 text-white" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="absolute inset-0 bg-linear-to-t from-black/45 to-transparent" />

                                    <div className="absolute left-5 bottom-4 flex items-center gap-3">
                                        <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-black/20 border border-white/20 overflow-hidden">
                                            {business.logoUrl ? (
                                                <img
                                                    src={business.logoUrl}
                                                    alt={business.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-white font-black text-lg tracking-tighter">
                                                    {getInitials(business.name)}
                                                </span>
                                            )}
                                        </div>

                                        <div>
                                            <p className="text-white font-black text-lg leading-tight line-clamp-1">
                                                {business.name}
                                            </p>
                                            <p className="text-indigo-100 text-[11px] font-bold uppercase tracking-widest">
                                                Barbershop
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 md:p-6">
                                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 min-h-15">
                                        {business.description ||
                                            "Business profile available for appointments and services."}
                                    </p>

                                    <div className="mt-5 space-y-2">
                                        {business.address && (
                                            <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                                                <MapPin size={14} className="text-indigo-400 shrink-0" />
                                                <span className="truncate">{business.address}</span>
                                            </div>
                                        )}

                                        {business.phone && (
                                            <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                                                <Phone size={14} className="text-indigo-400 shrink-0" />
                                                <span className="truncate">{business.phone}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-5 grid grid-cols-2 gap-2">
                                        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-3">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">
                                                Barbers
                                            </p>
                                            <p className="text-lg font-black text-gray-900">
                                                {business.barberCount}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-3">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">
                                                Services
                                            </p>
                                            <p className="text-lg font-black text-gray-900">
                                                {business.serviceCount}
                                            </p>
                                        </div>
                                    </div>

                                    {!isServiceActive && (
                                        <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-100 p-3">
                                            <p className="text-xs text-amber-700 font-bold">
                                                {business.settings?.maintenanceMessage ||
                                                    "Appointments are temporarily paused."}
                                            </p>
                                        </div>
                                    )}

                                    <div className="mt-6 grid grid-cols-1 gap-2">
                                        <motion.button
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() =>
                                                router.push(`${localePrefix}/business/${business.slug}`)
                                            }
                                            className="w-full py-3 rounded-xl bg-gray-100 text-gray-700 text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                                        >
                                            View Business
                                            <ArrowRight size={16} />
                                        </motion.button>

                                        <motion.button
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() =>
                                                router.push(
                                                    `${localePrefix}/business/${business.slug}/book`
                                                )
                                            }
                                            disabled={!isServiceActive || business.barberCount === 0}
                                            className="w-full py-3.5 rounded-xl bg-gray-900 text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                        >
                                            <CalendarDays size={16} />
                                            Book Appointment
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}
        </div>
    );
}
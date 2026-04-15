"use client";

import { motion } from "framer-motion";
import { Mail, Phone, ShieldCheck, Star } from "lucide-react";

type Barber = {
    id: string;
    user: {
        name: string | null;
        email: string;
        phone: string;
    };
};

type Props = {
    barber: Barber;
};

export default function BarberCard({ barber }: Props) {
    const initials = barber.user.name
        ? barber.user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : "B";

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden bg-white border border-gray-100 rounded-4xl p-6 shadow-sm group"
        >
            <div className="absolute top-4 right-4 bg-emerald-50 text-emerald-600 p-1.5 rounded-full">
                <ShieldCheck size={16} />
            </div>

            <div className="flex items-center gap-5">
                {/* Avatar con gradiente y efecto de pulso suave */}
                <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-100 ring-4 ring-white">
                        <span className="text-white font-black text-xl tracking-tighter">
                            {initials}
                        </span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full" />
                </div>

                {/* Info del Barbero */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-black text-gray-900 text-lg tracking-tight">
                            {barber.user.name ?? "Master Barber"}
                        </h3>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-600 transition-colors">
                            <Phone size={12} className="text-indigo-400" />
                            <p className="text-xs font-bold tracking-tight">{barber.user.phone}</p>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-600 transition-colors">
                            <Mail size={12} className="text-indigo-400" />
                            <p className="text-xs font-bold tracking-tight truncate max-w-45">
                                {barber.user.email}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
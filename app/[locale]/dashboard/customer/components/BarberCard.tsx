"use client";

import { motion } from "framer-motion";
import { Mail, Phone, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

type Barber = {
    id: string;
    profileImageUrl?: string | null;
    user: {
        name: string | null;
        email: string;
        phone: string;
    };
};

type Props = {
    barber: Barber;
};

function getInitials(name: string) {
    return name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

export default function BarberCard({ barber }: Props) {
    const t = useTranslations("BarberCard");

    const barberName = barber.user.name ?? t("fallbackName");
    const initials = getInitials(barberName);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden bg-white border border-gray-100 rounded-4xl p-5 md:p-6 shadow-sm group"
        >
            <div
                className="absolute top-4 right-4 bg-emerald-50 text-emerald-600 p-1.5 rounded-full"
                title={t("verified")}
            >
                <ShieldCheck size={16} />
            </div>

            <div className="flex items-center gap-5">
                <div className="relative shrink-0">
                    <div className="w-20 h-20 rounded-3xl bg-linear-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-100 ring-4 ring-white overflow-hidden">
                        {barber.profileImageUrl ? (
                            <img
                                src={barber.profileImageUrl}
                                alt={barberName}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-white font-black text-2xl tracking-tighter">
                                {initials}
                            </span>
                        )}
                    </div>

                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full" />
                </div>

                <div className="flex-1 min-w-0 pr-7">
                    <h3 className="font-black text-gray-900 text-lg tracking-tight truncate">
                        {barberName}
                    </h3>

                    <div className="space-y-1 mt-2">
                        <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-600 transition-colors">
                            <Phone size={12} className="text-indigo-400 shrink-0" />
                            <p className="text-xs font-bold tracking-tight truncate">
                                {barber.user.phone}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-600 transition-colors">
                            <Mail size={12} className="text-indigo-400 shrink-0" />
                            <p className="text-xs font-bold tracking-tight truncate">
                                {barber.user.email}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
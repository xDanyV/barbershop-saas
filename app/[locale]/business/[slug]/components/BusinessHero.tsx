import Link from "next/link";
import {
    CalendarDays,
    MapPin,
    MessageCircle,
    Phone,
    Scissors,
    Sparkles,
} from "lucide-react";
import { getInitials, getWhatsAppUrl } from "@/[locale]/business/[slug]/lib/business-page.utils";

type Props = {
    business: {
        name: string;
        slug: string;
        description: string | null;
        phone: string | null;
        address: string | null;
        logoUrl: string | null;
        coverUrl: string | null;
        settings: {
            maintenanceMessage: string | null;
        } | null;
    };
    locale: string;
    isServiceActive: boolean;
    serviceCount: number;
    barberCount: number;
    galleryCount: number;
};

export default function BusinessHero({
    business,
    locale,
    isServiceActive,
    serviceCount,
    barberCount,
    galleryCount,
}: Props) {
    const bookUrl = `/${locale}/business/${business.slug}/book`;

    return (
        <section className="relative">
            <div className="absolute inset-0 bg-linear-to-b from-indigo-950/40 via-[#08080d] to-[#08080d]" />

            <div className="relative h-90 md:h-110 bg-linear-to-br from-indigo-700 via-indigo-950 to-black overflow-hidden">
                {business.coverUrl ? (
                    <img
                        src={business.coverUrl}
                        alt={business.name}
                        className="h-full w-full object-cover opacity-75"
                    />
                ) : (
                    <div className="absolute inset-0">
                        <div className="absolute right-20 top-10 opacity-10">
                            <Scissors size={280} className="-rotate-12 text-white" />
                        </div>
                        <div className="absolute left-25 bottom-25 w-80 h-80 bg-indigo-500/20 blur-[100px] rounded-full" />
                    </div>
                )}

                <div className="absolute inset-0 bg-linear-to-t from-[#08080d] via-[#08080d]/45 to-transparent" />
            </div>

            <div className="relative max-w-6xl mx-auto px-4 -mt-36 md:-mt-44 z-10">
                <div className="bg-white/10 border border-white/10 backdrop-blur-xl rounded-4xl md:rounded-[2.5rem] p-5 sm:p-8 md:p-10 shadow-2xl">
                    <div className="flex flex-col lg:flex-row lg:items-end gap-7">
                        <div className="flex flex-col sm:flex-row gap-5 flex-1">
                            <div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-black border border-white/20 overflow-hidden shadow-2xl shadow-indigo-950/30 shrink-0">
                                {business.logoUrl ? (
                                    <img
                                        src={business.logoUrl}
                                        alt={business.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    getInitials(business.name)
                                )}
                            </div>

                            <div className="flex-1">
                                <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-400/20 text-indigo-200 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] mb-4">
                                    <Sparkles size={13} />
                                    Perfil del negocio
                                </div>

                                <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[0.95]">
                                    {business.name}
                                </h1>

                                <p className="text-gray-300 mt-4 max-w-2xl leading-relaxed">
                                    {business.description ||
                                        "Agenda tu cita con profesionales listos para atenderte."}
                                </p>

                                <div className="flex flex-wrap gap-3 mt-6 text-sm text-gray-300">
                                    {business.address && (
                                        <span className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
                                            <MapPin size={16} className="text-indigo-300" />
                                            {business.address}
                                        </span>
                                    )}

                                    {business.phone && (
                                        <span className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
                                            <Phone size={16} className="text-indigo-300" />
                                            {business.phone}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col gap-3">
                            {isServiceActive ? (
                                <Link
                                    href={bookUrl}
                                    className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black px-6 py-4 rounded-2xl transition-colors shadow-xl shadow-indigo-950/30"
                                >
                                    <CalendarDays size={18} />
                                    Reservar cita
                                </Link>
                            ) : (
                                <div className="inline-flex items-center justify-center gap-2 bg-gray-700/60 text-gray-300 font-black px-6 py-4 rounded-2xl cursor-not-allowed">
                                    <CalendarDays size={18} />
                                    Reservas pausadas
                                </div>
                            )}

                            {business.phone && (
                                <a
                                    href={getWhatsAppUrl(business.phone)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-black px-6 py-4 rounded-2xl transition-colors"
                                >
                                    <MessageCircle size={18} />
                                    WhatsApp
                                </a>
                            )}
                        </div>
                    </div>

                    {!isServiceActive && (
                        <div className="mt-7 bg-amber-500/10 border border-amber-500/30 text-amber-100 rounded-2xl px-4 py-3 text-sm font-medium">
                            {business.settings?.maintenanceMessage ||
                                "El servicio de reservas está temporalmente inactivo."}
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-3 mt-8">
                        <div className="bg-black/20 border border-white/10 rounded-2xl p-4">
                            <p className="text-2xl font-black">{serviceCount}</p>
                            <p className="text-[10px] md:text-xs text-gray-400 font-black uppercase tracking-widest mt-1">
                                Servicios
                            </p>
                        </div>

                        <div className="bg-black/20 border border-white/10 rounded-2xl p-4">
                            <p className="text-2xl font-black">{barberCount}</p>
                            <p className="text-[10px] md:text-xs text-gray-400 font-black uppercase tracking-widest mt-1">
                                Barberos
                            </p>
                        </div>

                        <div className="bg-black/20 border border-white/10 rounded-2xl p-4">
                            <p className="text-2xl font-black">{galleryCount}</p>
                            <p className="text-[10px] md:text-xs text-gray-400 font-black uppercase tracking-widest mt-1">
                                Fotos
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
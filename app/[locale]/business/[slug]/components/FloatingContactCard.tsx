import { MapPin, MessageCircle, Phone } from "lucide-react";
import { getWhatsAppUrl } from "../lib/business-page.utils";

type Props = {
    phone: string | null;
    address: string | null;
};

export default function FloatingContactCard({ phone, address }: Props) {
    if (!phone && !address) return null;

    return (
        <>
            <div className="fixed left-4 right-4 bottom-4 z-40 sm:hidden">
                {phone ? (
                    <a
                        href={getWhatsAppUrl(phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-white px-5 py-3 text-sm font-black shadow-2xl shadow-black/30"
                    >
                        <MessageCircle size={18} />
                        Contactar por WhatsApp
                    </a>
                ) : (
                    <div className="rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xl px-5 py-3 text-white text-sm font-bold shadow-2xl shadow-black/30">
                        {address}
                    </div>
                )}
            </div>

            <aside className="hidden sm:block fixed right-6 bottom-6 z-40 w-80">
                <div className="bg-white/10 border border-white/10 backdrop-blur-xl rounded-3xl p-5 text-white shadow-2xl shadow-black/30">
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-indigo-200 mb-4">
                        Contacto
                    </p>

                    <div className="space-y-3">
                        {address && (
                            <div className="flex items-start gap-3 text-sm text-gray-200">
                                <MapPin size={17} className="text-indigo-300 mt-0.5 shrink-0" />
                                <span>{address}</span>
                            </div>
                        )}

                        {phone && (
                            <div className="flex items-start gap-3 text-sm text-gray-200">
                                <Phone size={17} className="text-indigo-300 mt-0.5 shrink-0" />
                                <span>{phone}</span>
                            </div>
                        )}
                    </div>

                    {phone && (
                        <a
                            href={getWhatsAppUrl(phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-emerald-100 font-black px-4 py-3 rounded-2xl transition-colors"
                        >
                            <MessageCircle size={18} />
                            Enviar WhatsApp
                        </a>
                    )}
                </div>
            </aside>
        </>
    );
}
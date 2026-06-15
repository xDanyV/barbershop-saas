import { MapPin, MessageCircle, Phone, Star } from "lucide-react";
import { getWhatsAppUrl } from "../lib/business-page.utils";

type Props = {
    phone: string | null;
    address: string | null;
};

export default function BusinessContactCard({ phone, address }: Props) {
    return (
        <div className="bg-white/6 border border-white/10 rounded-4xl p-6">
            <div className="flex items-center gap-2 text-indigo-300 mb-4">
                <Star size={18} />
                <p className="text-sm font-black uppercase tracking-widest">
                    Contacto
                </p>
            </div>

            <div className="space-y-3">
                {address && (
                    <div className="flex items-start gap-3 text-sm text-gray-300">
                        <MapPin size={17} className="text-indigo-300 mt-0.5 shrink-0" />
                        <span>{address}</span>
                    </div>
                )}

                {phone && (
                    <div className="flex items-start gap-3 text-sm text-gray-300">
                        <Phone size={17} className="text-indigo-300 mt-0.5 shrink-0" />
                        <span>{phone}</span>
                    </div>
                )}

                {!address && !phone && (
                    <p className="text-sm text-gray-400">
                        Este negocio aún no agregó información de contacto.
                    </p>
                )}
            </div>

            {phone && (
                <a
                    href={getWhatsAppUrl(phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-400/20 text-emerald-200 font-black px-4 py-3 rounded-2xl transition-colors"
                >
                    <MessageCircle size={18} />
                    Enviar WhatsApp
                </a>
            )}
        </div>
    );
}
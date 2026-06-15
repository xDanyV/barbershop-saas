import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";

type Props = {
    locale: string;
    slug: string;
};

export default function BusinessPublicNavbar({ locale, slug }: Props) {
    return (
        <header className="sticky top-0 z-50 bg-indigo-950/95 backdrop-blur-xl border-b border-indigo-800/50 text-white">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                <Link
                    href={`/${locale}/dashboard/customer/home`}
                    className="flex items-center gap-2 min-w-0"
                >
                    <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold shadow-inner shrink-0">
                        B
                    </div>

                    <h1 className="text-sm md:text-base font-bold tracking-tighter uppercase truncate">
                        Barber<span className="text-indigo-400">SaaS</span>
                    </h1>
                </Link>

                <nav className="flex items-center gap-2">
                    <Link
                        href={`/${locale}/dashboard/customer/barbers`}
                        className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-indigo-100 text-xs font-bold transition-all"
                    >
                        <ArrowLeft size={14} />
                        Ver barberías
                    </Link>
                </nav>
            </div>
        </header>
    );
}
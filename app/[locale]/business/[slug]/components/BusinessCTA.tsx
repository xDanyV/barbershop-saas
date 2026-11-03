import Link from "next/link";
import { CalendarDays, Scissors } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = {
    businessName: string;
    bookUrl: string;
    isServiceActive: boolean;
};

export default function BusinessCTA({
    businessName,
    bookUrl,
    isServiceActive,
}: Props) {
    const t = useTranslations("BusinessPage.cta");

    return (
        <section className="max-w-6xl mx-auto px-4 pb-16">
            <div className="relative overflow-hidden bg-linear-to-br from-indigo-600 to-purple-700 rounded-4xl p-8 md:p-10 text-center shadow-2xl shadow-indigo-950/30">
                <div className="absolute right-10 top-10 opacity-10">
                    <Scissors size={180} className="-rotate-12" />
                </div>

                <div className="relative z-10">
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight">
                        {t("title")}
                    </h2>

                    <p className="text-indigo-100 mt-3 max-w-xl mx-auto">
                        {t("subtitle", { name: businessName })}
                    </p>

                    {isServiceActive ? (
                        <Link
                            href={bookUrl}
                            className="mt-7 inline-flex items-center justify-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 font-black px-6 py-4 rounded-2xl transition-colors"
                        >
                            <CalendarDays size={18} />
                            {t("book")}
                        </Link>
                    ) : (
                        <p className="mt-7 inline-flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white font-black px-6 py-4 rounded-2xl">
                            {t("paused")}
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
}
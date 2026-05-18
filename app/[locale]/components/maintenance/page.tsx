import { prisma } from "@/lib/prisma";
import { AlertTriangle, Clock, ArrowLeft } from "lucide-react";
import { Link, redirect } from "../../../../i18n/routing";
import { getTranslations, getLocale } from "next-intl/server";

export default async function MaintenancePage() {

    const t = await getTranslations("Maintenance");
    const locale = await getLocale();

    const settings = await prisma.systemSettings.findUnique({
        where: { id: "global" }
    });

    if (!settings || settings.isServiceActive) {
        // Envolvemos la ruta y el idioma en un objeto {}
        redirect({ href: "/dashboard/customer", locale });
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-[3rem] p-8 md:p-12 shadow-xl text-center border border-gray-100">
                <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-8 text-amber-500 shadow-inner">
                    <AlertTriangle size={48} />
                </div>

                <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-4">
                    {t("title")}
                </h1>

                <p className="text-gray-500 font-medium text-lg mb-8 leading-relaxed">
                    {settings?.maintenanceMessage}
                </p>
                
                <div className="flex items-center justify-center gap-2 text-sm font-bold text-gray-400 bg-gray-50 py-3 rounded-xl mb-6">
                    <Clock size={16} />
                    <span>{t("waitMessage")}</span>
                </div>

                <Link
                    href="/"
                    className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-gray-900 text-white text-sm font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-gray-200 hover:shadow-indigo-200 active:scale-95"
                >
                    <ArrowLeft size={18} />
                    {t("backButton")}
                </Link>
            </div>
        </div>
    );
}
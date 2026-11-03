import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "../../../../i18n/routing";

import BannedCustomerScreen from "@/[locale]/dashboard/customer/components/BannedCustomerScreen";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
    // Mantenimiento global de la plataforma (lo controla el ADMIN)
    const settings = await prisma.systemSettings.findUnique({
        where: { id: "global" },
        select: { isServiceActive: true },
    });

    if (settings && settings.isServiceActive === false) {
        const locale = await getLocale();
        redirect({ href: "/maintenance", locale });
    }

    // El proxy ya cargó la sesión desde la base, incluido el ban
    const headerList = await headers();
    const isBanned = headerList.get("x-user-banned") === "true";

    return (
        <>
            {isBanned && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10">
                    <BannedCustomerScreen />
                </div>
            )}

            <div className={isBanned ? "blur-md pointer-events-none select-none overflow-hidden h-screen" : ""}>
                {children}
            </div>
        </>
    );
}

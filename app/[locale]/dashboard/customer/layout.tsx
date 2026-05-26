import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

import BannedCustomerScreen from "@/[locale]/dashboard/customer/components/BannedCustomerScreen";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
    const settings = await prisma.systemSettings.findUnique({
        where: { id: "global" }
    });

    if (settings && settings.isServiceActive === false) {
        redirect("/components/maintenance");
    }

    const headerList = await headers();
    const userId = headerList.get("x-user-id");

    let isBanned = false;

    if (userId) {

        const user = await prisma.user.findUnique({
            where: { id: userId }, // Buscamos por la llave primaria 'id'
            select: { isBanned: true }
        });
        isBanned = user?.isBanned || false;
    }
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
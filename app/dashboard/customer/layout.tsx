import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {

    const settings = await prisma.systemSettings.findUnique({
        where: { id: "global" }
    });

    if (settings && settings.isServiceActive === false) {
        redirect("/components/maintenance");
    }

    return (
        <>
            {children}
        </>
    );
}
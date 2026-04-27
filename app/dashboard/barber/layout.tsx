import { headers } from "next/headers";
import PendingApproval from "@/components/barber/PendingApproval";

export default async function BarberDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const headerList = await headers();
    const status = headerList.get("x-barber-status");
    const role = headerList.get("x-user-role");

    const isApproved = status === "APPROVED" || role === "ADMIN";

    return (
        <>
            {!isApproved && <PendingApproval />}

            <div className={!isApproved ? "blur-md pointer-events-none select-none" : ""}>
                {children}
            </div>
        </>
    );
}
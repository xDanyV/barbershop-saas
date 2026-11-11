import { headers } from "next/headers";
import PendingApproval from "@/[locale]/components/barber/PendingApproval";
import TeamBarberSelector from "./components/TeamBarberSelector";

export default async function BarberDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const headerList = await headers();
    const status = headerList.get("x-barber-status");
    const role = headerList.get("x-user-role");
    const barberId = headerList.get("x-barber-id");

    const isApproved = status === "APPROVED" || role === "ADMIN";

    return (
        <>
            {!isApproved && <PendingApproval variant={status === "INACTIVE" ? "inactive" : "pending"} />}

            {role === "OWNER" && <TeamBarberSelector currentBarberId={barberId} />}

            <div className={!isApproved ? "blur-md pointer-events-none select-none" : ""}>
                {children}
            </div>
        </>
    );
}

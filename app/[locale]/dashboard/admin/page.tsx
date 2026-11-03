import { headers } from "next/headers";
import AdminDashboardClient from "./components/AdminDashboardClient";

export default async function AdminDashboard() {
    // El proxy solo deja pasar a ADMIN y OWNER y define el rol actual
    const headerList = await headers();
    const role = headerList.get("x-user-role") ?? "";

    return <AdminDashboardClient role={role} />;
}

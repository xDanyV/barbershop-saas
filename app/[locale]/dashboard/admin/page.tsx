import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/[locale]/components/PageHeader";
import AdminDashboardClient from "./components/AdminDashboardClient";
import OwnerOverview from "./components/OwnerOverview";

// Inicio del dueño (resumen de su barbería) o panel de la plataforma (administrador)
export default async function AdminDashboard() {
    const headerList = await headers();
    const role = headerList.get("x-user-role") ?? "";

    if (role !== "OWNER") return <AdminDashboardClient />;

    const t = await getTranslations("OwnerHome");
    const businessId = headerList.get("x-business-id");
    const business = businessId
        ? await prisma.business.findUnique({ where: { id: businessId }, select: { name: true } })
        : null;

    return (
        <>
            <PageHeader title={business?.name ?? t("title")} subtitle={t("subtitle")} />
            <OwnerOverview />
        </>
    );
}

import { headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import PageHeader from "@/[locale]/components/PageHeader";
import CustomersList from "../components/CustomersList";

// Clientes que han reservado en la barbería, con la opción de bloquear a quien no se presenta
export default async function CustomersPage() {
    const headerList = await headers();
    const locale = await getLocale();

    if (headerList.get("x-user-role") !== "OWNER") redirect(`/${locale}/dashboard/admin`);

    const t = await getTranslations("CustomersPage");

    return (
        <div className="pb-6">
            <PageHeader title={t("title")} subtitle={t("subtitle")} />
            <CustomersList />
        </div>
    );
}

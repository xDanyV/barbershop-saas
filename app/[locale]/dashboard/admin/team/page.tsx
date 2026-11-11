import { headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/[locale]/components/PageHeader";
import TeamList from "./TeamList";
import PendingBarbersList from "../components/PendingBarbersList";
import TeamInvite from "./TeamInvite";

// Equipo de la barbería: invitar, aprobar y administrar a los barberos (solo el dueño)
export default async function TeamPage() {
    const headerList = await headers();
    const locale = await getLocale();

    if (headerList.get("x-user-role") !== "OWNER") redirect(`/${locale}/dashboard/admin`);

    const t = await getTranslations("TeamPage");
    const businessId = headerList.get("x-business-id");
    const business = businessId
        ? await prisma.business.findUnique({ where: { id: businessId }, select: { slug: true, name: true } })
        : null;

    return (
        <div className="space-y-8 pb-6">
            <PageHeader title={t("title")} subtitle={t("subtitle")} />

            {business && <TeamInvite slug={business.slug} businessName={business.name} />}

            <section>
                <h2 className="mb-1 text-xl font-semibold">{t("requests")}</h2>
                <p className="mb-4 text-gray-600">{t("requestsHint")}</p>
                <PendingBarbersList />
            </section>

            <section>
                <h2 className="mb-1 text-xl font-semibold">{t("members")}</h2>
                <p className="mb-4 text-gray-600">{t("membersHint")}</p>
                <TeamList />
            </section>
        </div>
    );
}

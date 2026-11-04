import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { brandFontClasses } from "@/[locale]/brand";
import { getBillingAlert } from "@/lib/billing/periods";
import { prisma } from "@/lib/prisma";

// Aviso para el dueño cuando su membresía necesita atención. Sin nada que avisar no muestra nada.
export default async function BillingBanner({ businessId }: { businessId: string }) {
    const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: {
            active: true,
            subscription: { select: { billingStatus: true, currentPeriodEnd: true } },
        },
    });

    if (!business) return null;

    const t = await getTranslations("Billing");

    // Lo decidió la plataforma: pagar no lo resuelve, así que no lleva enlace a la membresía
    if (!business.active) {
        return (
            <aside
                role="status"
                className={`brand ${brandFontClasses} px-4 py-3 sm:px-8`}
                style={{ background: "var(--brand-accent)", color: "var(--brand-ink)" }}
            >
                <p className="mx-auto max-w-7xl text-[length:var(--step-small)] font-semibold">{t("alerts.deactivated")}</p>
            </aside>
        );
    }

    if (!business.subscription) return null;

    const alert = getBillingAlert({
        status: business.subscription.billingStatus,
        currentPeriodEnd: business.subscription.currentPeriodEnd,
        now: new Date(),
    });

    if (!alert) return null;

    const locale = await getLocale();
    const blocked = alert.kind === "suspended" || alert.kind === "canceled" || alert.kind === "pending";

    return (
        <aside
            role="status"
            className={`brand ${brandFontClasses} px-4 py-3 sm:px-8`}
            style={{
                background: blocked ? "var(--brand-accent)" : "var(--brand-sand)",
                color: "var(--brand-ink)",
            }}
        >
            <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <p className="text-[length:var(--step-small)] font-semibold">
                    {t(`alerts.${alert.kind}`, { days: alert.days })}
                </p>
                <Link
                    href={`/${locale}/dashboard/admin/my-business?tab=membership`}
                    className="shrink-0 text-[length:var(--step-small)] font-semibold underline underline-offset-4"
                >
                    {t("alerts.action")}
                </Link>
            </div>
        </aside>
    );
}

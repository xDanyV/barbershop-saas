"use client";

import { useEffect, useState } from "react";
import type { BusinessBillingStatus, BusinessPlanType, PaymentMethod } from "@prisma/client";
import { useLocale, useTranslations } from "next-intl";
import { brandFontClasses } from "@/[locale]/brand";
import { formatPriceFromCents, getBillingPlan } from "@/lib/billing/pricing";

type Props = {
    billingStatus: BusinessBillingStatus;
    billingPlan: BusinessPlanType;
    subscriptionEndsAt?: string | Date | null;
};

type Payment = {
    id: string;
    amountCents: number;
    method: PaymentMethod;
    months: number;
    paidAt: string;
    periodEnd: string;
};

export default function BusinessBillingCard({ billingStatus, billingPlan, subscriptionEndsAt }: Props) {
    const t = useTranslations("Billing");
    const locale = useLocale();
    const [data, setData] = useState<{ payments: Payment[]; instructions: string | null } | null>(null);

    useEffect(() => {
        let ignore = false;

        fetch("/api/protected/businesses/me/payments")
            .then((res) => (res.ok ? res.json() : null))
            .catch(() => null)
            .then((result) => {
                if (!ignore) setData(result ?? { payments: [], instructions: null });
            });

        return () => {
            ignore = true;
        };
    }, []);

    const formatDate = (date: string | Date) =>
        new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-MX", {
            day: "numeric",
            month: "long",
            year: "numeric",
        }).format(new Date(date));

    const plan = getBillingPlan(billingPlan);

    return (
        <section className={`brand ${brandFontClasses} p-5 sm:p-8`} style={{ background: "var(--brand-paper)" }}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                <h2 className="brand-display text-[length:var(--step-head)]">{t("card.title")}</h2>
                <p className="font-semibold">{t(`status.${billingStatus}`)}</p>
            </div>

            <p className="mt-2 max-w-[60ch] text-[var(--brand-muted)]">{t(`descriptions.${billingStatus}`)}</p>

            <dl className="mt-6 grid gap-4 sm:grid-cols-3">
                <div>
                    <dt className="text-[length:var(--step-small)] text-[var(--brand-muted)]">{t("card.plan")}</dt>
                    <dd className="mt-1 font-semibold">{t(`plans.${billingPlan}`)}</dd>
                </div>
                <div>
                    <dt className="text-[length:var(--step-small)] text-[var(--brand-muted)]">{t("card.price")}</dt>
                    <dd className="tabular mt-1 font-semibold">
                        {formatPriceFromCents(plan.monthlyPriceCents)} {plan.currency}
                        {t("card.perMonth")}
                    </dd>
                </div>
                {subscriptionEndsAt && (
                    <div>
                        <dt className="text-[length:var(--step-small)] text-[var(--brand-muted)]">
                            {billingStatus === "TRIALING" ? t("card.trialEnds") : t("card.validUntil")}
                        </dt>
                        <dd className="mt-1 font-semibold">{formatDate(subscriptionEndsAt)}</dd>
                    </div>
                )}
            </dl>

            {data?.instructions && (
                <div className="mt-6 p-4" style={{ background: "var(--brand-bg)" }}>
                    <h3 className="font-semibold">{t("card.howToPay")}</h3>
                    <p className="mt-1 whitespace-pre-line text-[var(--brand-muted)]">{data.instructions}</p>
                </div>
            )}

            <h3 className="mt-8 font-semibold">{t("card.history")}</h3>

            {data === null ? (
                <p className="mt-2 text-[var(--brand-muted)]">{t("card.loading")}</p>
            ) : data.payments.length === 0 ? (
                <p className="mt-2 text-[var(--brand-muted)]">{t("card.noPayments")}</p>
            ) : (
                <ul className="mt-2 divide-y divide-[var(--brand-surface)]">
                    {data.payments.map((payment) => (
                        <li key={payment.id} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3">
                            <span>
                                <span className="tabular font-semibold">{formatPriceFromCents(payment.amountCents)}</span>
                                <span className="text-[var(--brand-muted)]"> · {t(`methods.${payment.method}`)}</span>
                            </span>
                            <span className="text-[length:var(--step-small)] text-[var(--brand-muted)]">
                                {t("card.paidOn", { date: formatDate(payment.paidAt) })}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { BusinessBillingStatus, BusinessPlanType, PaymentMethod } from "@prisma/client";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { brandFontClasses } from "@/[locale]/brand";
import BrandDialog, { brandInput, brandPrimaryButton } from "@/[locale]/components/BrandDialog";
import type { BillingAlert } from "@/lib/billing/periods";
import { formatPriceFromCents, getBillingPlan } from "@/lib/billing/pricing";

type BusinessItem = {
    id: string;
    name: string;
    slug: string;
    billingStatus: BusinessBillingStatus;
    billingPlan: BusinessPlanType;
    subscriptionEndKey: string | null;
    alert: BillingAlert | null;
    owner: { name: string | null; email: string };
};

type Payment = {
    id: string;
    amountCents: number;
    method: PaymentMethod;
    months: number;
    paidAt: string;
    periodEnd: string;
    note: string | null;
    voidedAt: string | null;
};

type DialogState =
    | { type: "payment" | "history" | "adjust"; business: BusinessItem }
    | null;

const STATUSES: BusinessBillingStatus[] = ["TRIALING", "PENDING_PAYMENT", "ACTIVE", "PAST_DUE", "SUSPENDED", "CANCELED"];
const PLANS: BusinessPlanType[] = ["FOUNDER", "BASIC"];
const METHODS: PaymentMethod[] = ["TRANSFER", "CASH", "CARD", "OTHER"];

// Primero lo que necesita atención
const URGENCY: Record<BillingAlert["kind"], number> = {
    suspended: 0,
    pastDue: 1,
    pending: 2,
    dueSoon: 3,
    trialEnding: 4,
    canceled: 6,
};

function urgency(business: BusinessItem) {
    return business.alert ? URGENCY[business.alert.kind] : 5;
}

function localDateKey(date = new Date()) {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
}

export default function BusinessBillingManager() {
    const t = useTranslations("Billing");
    const locale = useLocale();
    const [businesses, setBusinesses] = useState<BusinessItem[] | null>(null);
    const [collected, setCollected] = useState(0);
    const [dialog, setDialog] = useState<DialogState>(null);

    const load = useCallback(async () => {
        const res = await fetch("/api/admin/businesses/billing").catch(() => null);

        if (!res?.ok) {
            toast.error(t("admin.errors.load"));
            setBusinesses((prev) => prev ?? []);
            return;
        }

        const data = await res.json();
        setBusinesses(data.businesses);
        setCollected(data.collectedThisMonthCents);
    }, [t]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial desde la API
        load();
    }, [load]);

    const sorted = useMemo(
        () => [...(businesses ?? [])].sort((a, b) => urgency(a) - urgency(b) || a.name.localeCompare(b.name)),
        [businesses]
    );

    const formatKey = (key: string) =>
        new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-MX", {
            day: "numeric",
            month: "short",
            year: "numeric",
            timeZone: "UTC",
        }).format(new Date(`${key}T12:00:00Z`));

    const count = (kinds: BillingAlert["kind"][]) =>
        (businesses ?? []).filter((b) => b.alert && kinds.includes(b.alert.kind)).length;

    const stats = [
        { label: t("admin.stats.attention"), value: String(count(["pastDue", "suspended", "pending"])) },
        { label: t("admin.stats.dueSoon"), value: String(count(["dueSoon", "trialEnding"])) },
        { label: t("admin.stats.trial"), value: String((businesses ?? []).filter((b) => b.billingStatus === "TRIALING").length) },
        { label: t("admin.stats.collected"), value: formatPriceFromCents(collected) },
    ];

    const done = () => {
        setDialog(null);
        load();
    };

    return (
        <section className={`brand ${brandFontClasses} p-5 pb-24 sm:p-8 md:pb-8`}>
            <h2 className="brand-display text-[length:var(--step-head)]">{t("admin.title")}</h2>
            <p className="mt-2 max-w-[60ch] text-[var(--brand-muted)]">{t("admin.subtitle")}</p>

            <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {stats.map((stat) => (
                    <div key={stat.label} className="p-4" style={{ background: "var(--brand-paper)" }}>
                        <dt className="text-[length:var(--step-small)] text-[var(--brand-muted)]">{stat.label}</dt>
                        <dd className="tabular mt-1 text-[length:var(--step-lead)] font-semibold">{stat.value}</dd>
                    </div>
                ))}
            </dl>

            {businesses === null ? (
                <p className="mt-8 text-[var(--brand-muted)]">{t("card.loading")}</p>
            ) : sorted.length === 0 ? (
                <p className="mt-8 text-[var(--brand-muted)]">{t("admin.empty")}</p>
            ) : (
                <ul className="mt-6 space-y-3">
                    {sorted.map((business) => (
                        <li key={business.id} className="p-4 sm:p-5" style={{ background: "var(--brand-paper)" }}>
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div className="min-w-0">
                                    <h3 className="truncate font-semibold">{business.name}</h3>
                                    <p className="truncate text-[length:var(--step-small)] text-[var(--brand-muted)]">
                                        {business.owner.name || business.owner.email} · {t(`plans.${business.billingPlan}`)}
                                    </p>
                                    <p className="mt-2 text-[length:var(--step-small)]">
                                        <span className="font-semibold">{t(`status.${business.billingStatus}`)}</span>
                                        {business.subscriptionEndKey && (
                                            <span className="text-[var(--brand-muted)]">
                                                {" · "}
                                                {t("admin.until", { date: formatKey(business.subscriptionEndKey) })}
                                            </span>
                                        )}
                                    </p>
                                    {business.alert && (
                                        <p className="mt-1 text-[length:var(--step-small)] font-semibold text-[#b8431f]">
                                            {t(`admin.alerts.${business.alert.kind}`, { days: business.alert.days })}
                                        </p>
                                    )}
                                </div>

                                <div className="flex shrink-0 flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setDialog({ type: "payment", business })}
                                        className="min-h-11 bg-[var(--brand-ink)] px-4 text-[length:var(--step-small)] font-semibold text-[var(--brand-paper)] transition-opacity hover:opacity-90"
                                    >
                                        {t("admin.recordPayment")}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDialog({ type: "history", business })}
                                        className="min-h-11 border border-[var(--brand-surface)] px-4 text-[length:var(--step-small)] font-semibold transition-colors hover:border-[var(--brand-ink)]"
                                    >
                                        {t("admin.history")}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDialog({ type: "adjust", business })}
                                        className="min-h-11 border border-[var(--brand-surface)] px-4 text-[length:var(--step-small)] font-semibold transition-colors hover:border-[var(--brand-ink)]"
                                    >
                                        {t("admin.adjust")}
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {dialog?.type === "payment" && <PaymentDialog business={dialog.business} onClose={() => setDialog(null)} onDone={done} />}
            {dialog?.type === "history" && <HistoryDialog business={dialog.business} onClose={() => setDialog(null)} onChanged={load} />}
            {dialog?.type === "adjust" && <AdjustDialog business={dialog.business} onClose={() => setDialog(null)} onDone={done} />}
        </section>
    );
}

function PaymentDialog({ business, onClose, onDone }: { business: BusinessItem; onClose: () => void; onDone: () => void }) {
    const t = useTranslations("Billing");
    const monthly = getBillingPlan(business.billingPlan).monthlyPriceCents;
    const [months, setMonths] = useState(1);
    const [amount, setAmount] = useState(String(monthly / 100));
    const [method, setMethod] = useState<PaymentMethod>("TRANSFER");
    const [paidAt, setPaidAt] = useState(() => localDateKey());
    const [note, setNote] = useState("");
    const [saving, setSaving] = useState(false);

    const changeMonths = (value: number) => {
        setMonths(value);
        setAmount(String((monthly * value) / 100));
    };

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch(`/api/admin/businesses/${business.id}/payments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ months, amountCents: Math.round(Number(amount) * 100), method, paidAt, note }),
            });

            if (!res.ok) {
                toast.error(t("admin.errors.payment"));
                return;
            }

            toast.success(t("admin.paymentSaved"));
            onDone();
        } catch {
            toast.error(t("admin.errors.payment"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <BrandDialog title={t("admin.recordPayment")} subtitle={business.name} closeLabel={t("admin.close")} onClose={() => !saving && onClose()}>
            <form onSubmit={submit} className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                    <label className="block min-w-0 font-semibold">
                        {t("admin.months")}
                        <select value={months} onChange={(e) => changeMonths(Number(e.target.value))} className={brandInput}>
                            {[1, 2, 3, 6, 12].map((value) => (
                                <option key={value} value={value}>
                                    {value}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="block min-w-0 font-semibold">
                        {t("admin.amount")}
                        <input
                            required
                            type="number"
                            min="0"
                            step="0.01"
                            inputMode="decimal"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className={brandInput}
                        />
                    </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <label className="block min-w-0 font-semibold">
                        {t("admin.method")}
                        <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className={brandInput}>
                            {METHODS.map((value) => (
                                <option key={value} value={value}>
                                    {t(`methods.${value}`)}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="block min-w-0 font-semibold">
                        {t("admin.paidAt")}
                        <input
                            required
                            type="date"
                            max={localDateKey()}
                            value={paidAt}
                            onChange={(e) => setPaidAt(e.target.value)}
                            className={brandInput}
                        />
                    </label>
                </div>

                <label className="block font-semibold">
                    {t("admin.note")}
                    <input maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} className={brandInput} />
                </label>

                <button type="submit" disabled={saving} className={brandPrimaryButton}>
                    {saving ? t("admin.saving") : t("admin.savePayment")}
                </button>
            </form>
        </BrandDialog>
    );
}

function HistoryDialog({ business, onClose, onChanged }: { business: BusinessItem; onClose: () => void; onChanged: () => void }) {
    const t = useTranslations("Billing");
    const locale = useLocale();
    const [payments, setPayments] = useState<Payment[] | null>(null);
    const [voiding, setVoiding] = useState(false);

    const load = useCallback(async () => {
        const res = await fetch(`/api/admin/businesses/${business.id}/payments`).catch(() => null);
        setPayments(res?.ok ? await res.json() : []);
    }, [business.id]);

    useEffect(() => {
        load();
    }, [load]);

    const formatDate = (date: string) =>
        new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-MX", { day: "numeric", month: "short", year: "numeric" }).format(new Date(date));

    const latestId = payments?.find((payment) => !payment.voidedAt)?.id;

    const voidLatest = async () => {
        if (!window.confirm(t("admin.voidConfirm"))) return;

        setVoiding(true);

        try {
            const res = await fetch(`/api/admin/businesses/${business.id}/payments`, { method: "DELETE" });

            if (!res.ok) {
                toast.error(res.status === 409 ? t("admin.errors.voidChanged") : t("admin.errors.void"));
                return;
            }

            toast.success(t("admin.voided"));
            await load();
            onChanged();
        } catch {
            toast.error(t("admin.errors.void"));
        } finally {
            setVoiding(false);
        }
    };

    return (
        <BrandDialog title={t("admin.history")} subtitle={business.name} closeLabel={t("admin.close")} onClose={onClose}>
            {payments === null ? (
                <p className="text-[var(--brand-muted)]">{t("card.loading")}</p>
            ) : payments.length === 0 ? (
                <p className="text-[var(--brand-muted)]">{t("card.noPayments")}</p>
            ) : (
                <ul className="max-h-96 divide-y divide-[var(--brand-surface)] overflow-y-auto">
                    {payments.map((payment) => (
                        <li key={payment.id} className={`py-3 ${payment.voidedAt ? "opacity-60" : ""}`}>
                            <p className="flex flex-wrap items-baseline justify-between gap-x-4">
                                <span className={`tabular font-semibold ${payment.voidedAt ? "line-through" : ""}`}>
                                    {formatPriceFromCents(payment.amountCents)}
                                </span>
                                <span className="text-[length:var(--step-small)] text-[var(--brand-muted)]">{formatDate(payment.paidAt)}</span>
                            </p>
                            <p className="text-[length:var(--step-small)] text-[var(--brand-muted)]">
                                {t(`methods.${payment.method}`)} · {t("admin.monthsCount", { months: payment.months })} ·{" "}
                                {t("admin.until", { date: formatDate(payment.periodEnd) })}
                                {payment.voidedAt && ` · ${t("admin.voidedLabel")}`}
                            </p>
                            {payment.note && <p className="mt-1 text-[length:var(--step-small)]">{payment.note}</p>}
                            {payment.id === latestId && (
                                <button
                                    type="button"
                                    onClick={voidLatest}
                                    disabled={voiding}
                                    className="mt-2 min-h-11 text-[length:var(--step-small)] font-semibold underline underline-offset-4 disabled:opacity-50"
                                >
                                    {t("admin.void")}
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </BrandDialog>
    );
}

function AdjustDialog({ business, onClose, onDone }: { business: BusinessItem; onClose: () => void; onDone: () => void }) {
    const t = useTranslations("Billing");
    const [status, setStatus] = useState(business.billingStatus);
    const [plan, setPlan] = useState(business.billingPlan);
    const [ends, setEnds] = useState(business.subscriptionEndKey ?? "");
    const [saving, setSaving] = useState(false);

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch("/api/admin/businesses/billing", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ businessId: business.id, billingStatus: status, billingPlan: plan, subscriptionEndsAt: ends || null }),
            });

            if (!res.ok) {
                toast.error(t("admin.errors.adjust"));
                return;
            }

            toast.success(t("admin.adjusted"));
            onDone();
        } catch {
            toast.error(t("admin.errors.adjust"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <BrandDialog title={t("admin.adjust")} subtitle={t("admin.adjustHint")} closeLabel={t("admin.close")} onClose={() => !saving && onClose()}>
            <form onSubmit={submit} className="space-y-5">
                <label className="block font-semibold">
                    {t("card.plan")}
                    <select value={plan} onChange={(e) => setPlan(e.target.value as BusinessPlanType)} className={brandInput}>
                        {PLANS.map((value) => (
                            <option key={value} value={value}>
                                {t(`plans.${value}`)} · {formatPriceFromCents(getBillingPlan(value).monthlyPriceCents)}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="block font-semibold">
                    {t("admin.statusLabel")}
                    <select value={status} onChange={(e) => setStatus(e.target.value as BusinessBillingStatus)} className={brandInput}>
                        {STATUSES.map((value) => (
                            <option key={value} value={value}>
                                {t(`status.${value}`)}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="block font-semibold">
                    {t("card.validUntil")}
                    <input type="date" value={ends} onChange={(e) => setEnds(e.target.value)} className={brandInput} />
                </label>

                <button type="submit" disabled={saving} className={brandPrimaryButton}>
                    {saving ? t("admin.saving") : t("admin.saveAdjust")}
                </button>
            </form>
        </BrandDialog>
    );
}

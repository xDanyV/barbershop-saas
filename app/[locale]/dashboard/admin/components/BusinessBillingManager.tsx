"use client";

import { useEffect, useState } from "react";
import type { BusinessBillingStatus, BusinessPlanType } from "@prisma/client";
import {
    Building2,
    CalendarDays,
    CreditCard,
    Loader2,
    Save,
    ShieldAlert,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { getBillingStatusLabel } from "@/lib/billing/status";
import { getBillingPlan } from "@/lib/billing/pricing";

type BusinessBillingItem = {
    id: string;
    name: string;
    slug: string;
    active: boolean;
    billingStatus: BusinessBillingStatus;
    billingPlan: BusinessPlanType;
    subscriptionEndsAt: string | null;
    owner: {
        id: string;
        name: string | null;
        email: string;
    };
    subscription: {
        id: string;
        provider: string;
        billingStatus: BusinessBillingStatus;
        currentPeriodEnd: string | null;
        monthlyPriceCents: number;
        currency: string;
    } | null;
};

type BillingDraft = {
    billingStatus: BusinessBillingStatus;
    billingPlan: BusinessPlanType;
    subscriptionEndsAt: string;
};

const statusOptions: BusinessBillingStatus[] = [
    "PENDING_PAYMENT",
    "ACTIVE",
    "PAST_DUE",
    "SUSPENDED",
    "CANCELED",
];

const planOptions: BusinessPlanType[] = ["FOUNDER", "BASIC"];

function toDateInputValue(date: string | null) {
    if (!date) return "";

    return new Date(date).toISOString().slice(0, 10);
}

function getStatusClass(status: BusinessBillingStatus) {
    const classes: Record<BusinessBillingStatus, string> = {
        ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-100",
        PAST_DUE: "bg-amber-50 text-amber-700 border-amber-100",
        PENDING_PAYMENT: "bg-yellow-50 text-yellow-700 border-yellow-100",
        SUSPENDED: "bg-red-50 text-red-700 border-red-100",
        CANCELED: "bg-gray-100 text-gray-700 border-gray-200",
    };

    return classes[status];
}

export default function BusinessBillingManager() {
    const [businesses, setBusinesses] = useState<BusinessBillingItem[]>([]);
    const [drafts, setDrafts] = useState<Record<string, BillingDraft>>({});
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);

    const loadBusinesses = async () => {
        try {
            setLoading(true);

            const res = await fetch("/api/admin/businesses/billing");
            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || "No se pudieron cargar los negocios");
                setBusinesses([]);
                return;
            }

            if (!Array.isArray(data)) {
                toast.error("Formato de respuesta inválido");
                setBusinesses([]);
                return;
            }

            setBusinesses(data);

            const nextDrafts = data.reduce<Record<string, BillingDraft>>(
                (acc, business: BusinessBillingItem) => {
                    acc[business.id] = {
                        billingStatus: business.billingStatus,
                        billingPlan: business.billingPlan,
                        subscriptionEndsAt: toDateInputValue(
                            business.subscriptionEndsAt
                        ),
                    };

                    return acc;
                },
                {}
            );

            setDrafts(nextDrafts);
        } catch (error) {
            console.error("Load businesses billing error:", error);
            toast.error("Error al cargar suscripciones");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBusinesses();
    }, []);

    const updateDraft = <K extends keyof BillingDraft>(
        businessId: string,
        key: K,
        value: BillingDraft[K]
    ) => {
        setDrafts((prev) => ({
            ...prev,
            [businessId]: {
                ...prev[businessId],
                [key]: value,
            },
        }));
    };

    const hasChanges = (business: BusinessBillingItem) => {
        const draft = drafts[business.id];

        if (!draft) return false;

        return (
            draft.billingStatus !== business.billingStatus ||
            draft.billingPlan !== business.billingPlan ||
            draft.subscriptionEndsAt !== toDateInputValue(business.subscriptionEndsAt)
        );
    };

    const handleSave = async (business: BusinessBillingItem) => {
        const draft = drafts[business.id];

        if (!draft) return;

        setSavingId(business.id);

        try {
            const res = await fetch("/api/admin/businesses/billing", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    businessId: business.id,
                    billingStatus: draft.billingStatus,
                    billingPlan: draft.billingPlan,
                    subscriptionEndsAt: draft.subscriptionEndsAt || null,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || "No se pudo actualizar");
                return;
            }

            setBusinesses((prev) =>
                prev.map((item) => (item.id === business.id ? data : item))
            );

            setDrafts((prev) => ({
                ...prev,
                [business.id]: {
                    billingStatus: data.billingStatus,
                    billingPlan: data.billingPlan,
                    subscriptionEndsAt: toDateInputValue(data.subscriptionEndsAt),
                },
            }));

            toast.success("Suscripción actualizada");
        } catch (error) {
            console.error("Save business billing error:", error);
            toast.error("Error al actualizar suscripción");
        } finally {
            setSavingId(null);
        }
    };

    if (loading) {
        return (
            <div className="p-10 text-center font-bold text-gray-400 flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={18} />
                Cargando suscripciones...
            </div>
        );
    }

    return (
        <section className="space-y-5">
            <div className="bg-white border border-gray-100 rounded-3xl p-5 md:p-6 shadow-sm">
                <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <CreditCard size={21} />
                    </div>

                    <div>
                        <h2 className="text-xl font-black text-gray-900">
                            Suscripciones de negocios
                        </h2>

                        <p className="text-sm text-gray-500 mt-1 max-w-2xl">
                            Administra manualmente el plan y estado de pago de cada negocio.
                            Esto sirve mientras integras Stripe o Mercado Pago.
                        </p>
                    </div>
                </div>
            </div>

            {businesses.length === 0 ? (
                <div className="min-h-64 rounded-3xl bg-white border border-dashed border-gray-200 flex flex-col items-center justify-center text-center px-6">
                    <ShieldAlert className="text-gray-300 mb-3" size={32} />
                    <p className="text-gray-500 font-bold">
                        No hay negocios registrados.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {businesses.map((business, index) => {
                        const draft = drafts[business.id];

                        if (!draft) return null;

                        const plan = getBillingPlan(draft.billingPlan);
                        const changed = hasChanges(business);
                        const saving = savingId === business.id;

                        return (
                            <motion.article
                                key={business.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                                className="bg-white border border-gray-100 rounded-3xl p-5 md:p-6 shadow-sm"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-gray-50 text-indigo-600 flex items-center justify-center shrink-0 border border-gray-100">
                                                <Building2 size={22} />
                                            </div>

                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="font-black text-gray-900 truncate">
                                                        {business.name}
                                                    </h3>

                                                    <span
                                                        className={`text-[10px] px-2.5 py-1 rounded-full border font-black ${getStatusClass(
                                                            business.billingStatus
                                                        )}`}
                                                    >
                                                        {getBillingStatusLabel(
                                                            business.billingStatus
                                                        )}
                                                    </span>
                                                </div>

                                                <p className="text-xs text-gray-400 font-bold mt-1">
                                                    /business/{business.slug}
                                                </p>

                                                <p className="text-xs text-gray-500 mt-2">
                                                    Owner:{" "}
                                                    <span className="font-bold text-gray-700">
                                                        {business.owner.name ||
                                                            business.owner.email}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:w-155">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                Plan
                                            </label>

                                            <select
                                                value={draft.billingPlan}
                                                onChange={(e) =>
                                                    updateDraft(
                                                        business.id,
                                                        "billingPlan",
                                                        e.target.value as BusinessPlanType
                                                    )
                                                }
                                                className="mt-2 w-full rounded-2xl border border-gray-200 px-3 py-3 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/30"
                                            >
                                                {planOptions.map((option) => (
                                                    <option key={option} value={option}>
                                                        {getBillingPlan(option).label}
                                                    </option>
                                                ))}
                                            </select>

                                            <p className="text-[11px] text-gray-400 font-bold mt-1">
                                                {plan.monthlyPriceLabel}
                                            </p>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                Estado
                                            </label>

                                            <select
                                                value={draft.billingStatus}
                                                onChange={(e) =>
                                                    updateDraft(
                                                        business.id,
                                                        "billingStatus",
                                                        e.target.value as BusinessBillingStatus
                                                    )
                                                }
                                                className="mt-2 w-full rounded-2xl border border-gray-200 px-3 py-3 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/30"
                                            >
                                                {statusOptions.map((option) => (
                                                    <option key={option} value={option}>
                                                        {getBillingStatusLabel(option)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                Corte
                                            </label>

                                            <div className="relative mt-2">
                                                <CalendarDays
                                                    size={15}
                                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                                />

                                                <input
                                                    type="date"
                                                    value={draft.subscriptionEndsAt}
                                                    onChange={(e) =>
                                                        updateDraft(
                                                            business.id,
                                                            "subscriptionEndsAt",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full rounded-2xl border border-gray-200 pl-9 pr-3 py-3 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/30"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleSave(business)}
                                        disabled={!changed || saving}
                                        className="lg:w-36 inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-black text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    >
                                        {saving ? (
                                            <Loader2 className="animate-spin" size={16} />
                                        ) : (
                                            <Save size={16} />
                                        )}
                                        Guardar
                                    </button>
                                </div>
                            </motion.article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
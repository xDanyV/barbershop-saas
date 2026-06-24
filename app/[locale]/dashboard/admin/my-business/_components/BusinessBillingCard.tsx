"use client";

import type { BusinessBillingStatus, BusinessPlanType } from "@prisma/client";
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    CreditCard,
    ShieldAlert,
} from "lucide-react";
import {
    canBusinessAcceptBookings,
    getBillingStatusDescription,
    getBillingStatusLabel,
} from "@/lib/billing/status";
import { getBillingPlan } from "@/lib/billing/pricing";

type Props = {
    billingStatus: BusinessBillingStatus;
    billingPlan: BusinessPlanType;
    subscriptionEndsAt?: string | Date | null;
};

const statusStyles: Record<
    BusinessBillingStatus,
    {
        card: string;
        badge: string;
        icon: React.ReactNode;
    }
> = {
    ACTIVE: {
        card: "bg-emerald-50 border-emerald-100",
        badge: "bg-emerald-100 text-emerald-700",
        icon: <CheckCircle2 size={18} />,
    },
    PAST_DUE: {
        card: "bg-amber-50 border-amber-100",
        badge: "bg-amber-100 text-amber-700",
        icon: <Clock size={18} />,
    },
    PENDING_PAYMENT: {
        card: "bg-yellow-50 border-yellow-100",
        badge: "bg-yellow-100 text-yellow-700",
        icon: <AlertTriangle size={18} />,
    },
    SUSPENDED: {
        card: "bg-red-50 border-red-100",
        badge: "bg-red-100 text-red-700",
        icon: <ShieldAlert size={18} />,
    },
    CANCELED: {
        card: "bg-gray-50 border-gray-200",
        badge: "bg-gray-200 text-gray-700",
        icon: <ShieldAlert size={18} />,
    },
};

function formatDate(date?: string | Date | null) {
    if (!date) return null;

    return new Intl.DateTimeFormat("es-MX", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(new Date(date));
}

export default function BusinessBillingCard({
    billingStatus,
    billingPlan,
    subscriptionEndsAt,
}: Props) {
    const plan = getBillingPlan(billingPlan);
    const status = statusStyles[billingStatus];
    const canAcceptBookings = canBusinessAcceptBookings(billingStatus);
    const formattedEndDate = formatDate(subscriptionEndsAt);

    return (
        <section
            className={`rounded-3xl border p-5 md:p-6 shadow-sm ${status.card}`}
        >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                        <CreditCard size={22} />
                    </div>

                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg md:text-xl font-black text-gray-900">
                                Suscripción
                            </h2>

                            <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black ${status.badge}`}
                            >
                                {status.icon}
                                {getBillingStatusLabel(billingStatus)}
                            </span>
                        </div>

                        <p className="mt-1 text-sm text-gray-600 font-medium">
                            {getBillingStatusDescription(billingStatus)}
                        </p>

                        {!canAcceptBookings && (
                            <p className="mt-2 text-xs font-bold text-red-600">
                                Las reservas públicas están pausadas hasta regularizar la suscripción.
                            </p>
                        )}

                        {billingStatus === "PAST_DUE" && (
                            <p className="mt-2 text-xs font-bold text-amber-700">
                                El negocio sigue aceptando reservas temporalmente, pero hay un pago pendiente.
                            </p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:min-w-80">
                    <div className="rounded-2xl bg-white border border-white/70 p-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            Plan actual
                        </p>

                        <p className="mt-1 text-sm font-black text-gray-900">
                            {plan.label}
                        </p>

                        <p className="mt-1 text-xs text-gray-500 font-medium">
                            {plan.description}
                        </p>
                    </div>

                    <div className="rounded-2xl bg-white border border-white/70 p-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            Mensualidad
                        </p>

                        <p className="mt-1 text-sm font-black text-gray-900">
                            {plan.monthlyPriceLabel}
                        </p>

                        <p className="mt-1 text-xs text-gray-500 font-medium">
                            {formattedEndDate
                                ? `Próximo corte: ${formattedEndDate}`
                                : "Pago manual por ahora"}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
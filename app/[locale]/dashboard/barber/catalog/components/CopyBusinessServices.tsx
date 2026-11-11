"use client";

import { useEffect, useState } from "react";
import { Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { formatPriceFromCents } from "@/lib/billing/pricing";
import { useApiError } from "@/[locale]/components/useApiError";
import { notifyBarberSetupChanged } from "../../setup-events";

type ServiceToCopy = { name: string; priceCents: number; duration: number };

// Opcional: un barbero sin catálogo puede empezar con los servicios que ya tiene la barbería
export default function CopyBusinessServices({ onCopied }: { onCopied: () => void }) {
    const t = useTranslations("CopyServices");
    const apiError = useApiError();
    const [services, setServices] = useState<ServiceToCopy[]>([]);
    const [working, setWorking] = useState(false);

    useEffect(() => {
        fetch("/api/protected/catalog/copy")
            .then((res) => (res.ok ? res.json() : []))
            .then((data) => setServices(Array.isArray(data) ? data : []))
            .catch(() => setServices([]));
    }, []);

    if (!services.length) return null;

    const copy = async () => {
        setWorking(true);

        try {
            const res = await fetch("/api/protected/catalog/copy", { method: "POST" });
            const data = await res.json().catch(() => null);

            if (!res.ok) {
                toast.error(apiError(data, t("failed")));
                return;
            }

            toast.success(t("copied", { count: data.created }));
            notifyBarberSetupChanged();
            onCopied();
        } catch {
            toast.error(t("failed"));
        } finally {
            setWorking(false);
        }
    };

    return (
        <section className="border border-gray-200 bg-white p-5 text-left md:p-6">
            <h2 className="text-lg font-semibold text-gray-900">{t("title")}</h2>
            <p className="mt-1 max-w-[60ch] text-gray-600">{t("text")}</p>

            <ul className="mt-4 divide-y divide-gray-100 border-y border-gray-100">
                {services.map((service) => (
                    <li key={service.name} className="flex items-baseline justify-between gap-4 py-2.5">
                        <span className="min-w-0 break-words font-medium text-gray-900">{service.name}</span>
                        <span className="shrink-0 text-sm tabular-nums text-gray-600">
                            {formatPriceFromCents(service.priceCents)} · {t("minutes", { minutes: service.duration })}
                        </span>
                    </li>
                ))}
            </ul>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                <button
                    type="button"
                    onClick={copy}
                    disabled={working}
                    className="inline-flex min-h-11 items-center justify-center gap-2 bg-gray-900 px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                    <Copy size={16} aria-hidden="true" />
                    {working ? t("copying") : t("action", { count: services.length })}
                </button>
                <p className="text-sm text-gray-500">{t("hint")}</p>
            </div>
        </section>
    );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import BrandDialog, { brandPrimaryButton } from "@/[locale]/components/BrandDialog";
import { useApiError } from "@/[locale]/components/useApiError";

type PendingBarber = {
    id: string;
    createdAt: string;
    profileImageUrl: string | null;
    user: { name: string | null; email: string; phone: string };
};

// Al aprobar a alguien, la lista del equipo se vuelve a cargar
export const TEAM_CHANGED = "team-changed";

// Solicitudes de barberos que se registraron con el enlace de invitación
export default function PendingBarbersList() {
    const t = useTranslations("PendingBarbersList");
    const apiError = useApiError();
    const [barbers, setBarbers] = useState<PendingBarber[] | null>(null);
    const [failed, setFailed] = useState(false);
    const [workingId, setWorkingId] = useState<string | null>(null);
    const [rejecting, setRejecting] = useState<PendingBarber | null>(null);

    const load = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/barbers");
            const data = await res.json().catch(() => null);

            if (!res.ok || !Array.isArray(data)) throw new Error();

            setBarbers(data);
            setFailed(false);
        } catch {
            setBarbers((current) => current ?? []);
            setFailed(true);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const decide = async (barber: PendingBarber, status: "APPROVED" | "REJECTED") => {
        setWorkingId(barber.id);
        const name = barber.user.name || t("barber.noName");

        try {
            const res = await fetch("/api/admin/barbers", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ barberId: barber.id, status }),
            });
            const data = await res.json().catch(() => null);

            if (!res.ok) {
                toast.error(apiError(data, t("errors.action")));
                return;
            }

            setBarbers((current) => (current ?? []).filter((item) => item.id !== barber.id));
            setRejecting(null);

            if (status === "APPROVED") {
                toast.success(t("approved", { name }));
                window.dispatchEvent(new Event(TEAM_CHANGED));
            } else {
                toast.success(t("rejected", { name }));
            }
        } catch {
            toast.error(t("errors.action"));
        } finally {
            setWorkingId(null);
        }
    };

    if (barbers === null) return <p className="py-6 text-gray-500">{t("loadingDir")}</p>;

    return (
        <>
            {failed && (
                <div role="alert" className="mb-4 flex flex-col gap-3 border-l-4 border-[#b8431f] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-gray-900">{t("errors.load")}</p>
                    <button type="button" onClick={load} className="min-h-11 border border-gray-200 px-4 text-sm font-semibold transition-colors hover:border-gray-900">
                        {t("retry")}
                    </button>
                </div>
            )}

            {barbers.length === 0 ? (
                !failed && <p className="border border-dashed border-gray-300 p-5 text-gray-500">{t("empty")}</p>
            ) : (
                <ul className="divide-y divide-gray-100 border border-gray-200 bg-white">
                    {barbers.map((barber) => {
                        const name = barber.user.name || t("barber.noName");
                        const working = workingId === barber.id;

                        return (
                            <li key={barber.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:gap-6 md:p-5">
                                <div className="flex min-w-0 flex-1 items-center gap-3">
                                    <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#f1f3f2] font-semibold" aria-hidden="true">
                                        {name.charAt(0).toUpperCase()}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="break-words font-semibold text-gray-900">{name}</p>
                                        <p className="break-all text-sm text-gray-500">
                                            {barber.user.phone} · {barber.user.email}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 md:flex">
                                    <button
                                        type="button"
                                        onClick={() => decide(barber, "APPROVED")}
                                        disabled={working}
                                        className="inline-flex min-h-11 items-center justify-center gap-2 bg-gray-900 px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                                    >
                                        <Check size={16} aria-hidden="true" />
                                        {t("actions.approve")}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRejecting(barber)}
                                        disabled={working}
                                        className="inline-flex min-h-11 items-center justify-center gap-2 border border-gray-200 px-4 text-sm font-semibold text-[#b8431f] transition-colors hover:border-[#b8431f] disabled:opacity-50"
                                    >
                                        <X size={16} aria-hidden="true" />
                                        {t("actions.reject")}
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            {rejecting && (
                <BrandDialog
                    title={t("rejectTitle", { name: rejecting.user.name || t("barber.noName") })}
                    subtitle={t("rejectText")}
                    closeLabel={t("keep")}
                    onClose={() => workingId === null && setRejecting(null)}
                >
                    <button type="button" onClick={() => decide(rejecting, "REJECTED")} disabled={workingId !== null} className={brandPrimaryButton}>
                        {t("actions.reject")}
                    </button>
                </BrandDialog>
            )}
        </>
    );
}

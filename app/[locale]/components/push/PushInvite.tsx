"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { usePushNotifications } from "./usePushNotifications";

const DISMISSED_KEY = "push-invite-dismissed";

// Invitación discreta en la agenda y en "Mis citas"; si la cierran no vuelve a salir en este dispositivo
export default function PushInvite({ audience }: { audience: "team" | "customer" }) {
    const t = useTranslations("PushInvite");
    const { state, working, enable } = usePushNotifications();
    const [dismissed, setDismissed] = useState(true);

    useEffect(() => {
        let value = false;
        try {
            value = window.localStorage.getItem(DISMISSED_KEY) === "1";
        } catch {
            // Sin almacenamiento la invitación simplemente se muestra
        }
        Promise.resolve().then(() => setDismissed(value));
    }, []);

    if (dismissed || state !== "off") return null;

    const dismiss = () => {
        setDismissed(true);
        try {
            window.localStorage.setItem(DISMISSED_KEY, "1");
        } catch {
            // Sin almacenamiento se oculta solo por ahora
        }
    };

    const accept = async () => {
        if (await enable()) {
            toast.success(t("done"));
            dismiss();
        }
    };

    return (
        <section aria-labelledby="push-invite-title" className="mb-6 flex items-start gap-3 border border-gray-200 bg-white p-4">
            <Bell size={20} className="mt-0.5 shrink-0 text-[#e8603a]" aria-hidden="true" />
            <div className="min-w-0 flex-1">
                <h2 id="push-invite-title" className="font-semibold text-gray-900">
                    {audience === "team" ? t("titleTeam") : t("titleCustomer")}
                </h2>
                <p className="mt-0.5 text-sm text-gray-600">{audience === "team" ? t("textTeam") : t("textCustomer")}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={accept}
                        disabled={working}
                        className="inline-flex min-h-11 items-center bg-gray-900 px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                        {t("accept")}
                    </button>
                    <button type="button" onClick={dismiss} className="inline-flex min-h-11 items-center px-3 text-sm font-semibold text-gray-700">
                        {t("later")}
                    </button>
                </div>
            </div>
            <button type="button" onClick={dismiss} aria-label={t("close")} className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center text-gray-500">
                <X size={18} aria-hidden="true" />
            </button>
        </section>
    );
}

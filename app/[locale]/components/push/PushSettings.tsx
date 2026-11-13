"use client";

import { Bell, BellOff } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { usePushNotifications } from "./usePushNotifications";

// En "Mi cuenta": prender o apagar los avisos de ESTE dispositivo
export default function PushSettings({ role, className = "" }: { role: string; className?: string }) {
    const t = useTranslations("PushSettings");
    const { state, working, enable, disable } = usePushNotifications();
    const forTeam = role !== "CUSTOMER";

    if (state === "loading" || state === "unavailable") return null;

    const toggle = async () => {
        if (state === "on") {
            await disable();
            toast.success(t("turnedOff"));
            return;
        }
        if (await enable()) toast.success(t("turnedOn"));
    };

    return (
        <section aria-labelledby="push-title" className={className}>
            <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-[var(--brand-sand)]" aria-hidden="true">
                    {state === "on" ? <Bell size={20} /> : <BellOff size={20} />}
                </span>
                <div className="min-w-0 flex-1">
                    <h2 id="push-title" className="text-[length:var(--step-lead)] font-semibold">
                        {t("title")}
                    </h2>
                    <p className="mt-1 text-[var(--brand-muted)]">{forTeam ? t("whatTeam") : t("whatCustomer")}</p>

                    {state === "unsupported" && <p className="mt-3">{t("unsupported")}</p>}
                    {state === "needsInstall" && <p className="mt-3">{t("needsInstall")}</p>}
                    {state === "denied" && <p className="mt-3">{t("denied")}</p>}

                    {(state === "on" || state === "off") && (
                        <button
                            type="button"
                            role="switch"
                            aria-checked={state === "on"}
                            onClick={toggle}
                            disabled={working}
                            className="mt-4 flex w-full items-center justify-between gap-4 border border-[var(--brand-surface)] bg-[var(--brand-bg)] px-4 py-3 text-left disabled:opacity-60"
                        >
                            <span>
                                <span className="block font-semibold">{state === "on" ? t("on") : t("off")}</span>
                                <span className="block text-[length:var(--step-small)] text-[var(--brand-muted)]">{t("thisDevice")}</span>
                            </span>
                            <span aria-hidden="true" className={`relative h-7 w-12 shrink-0 transition-colors ${state === "on" ? "bg-[#2f7d5b]" : "bg-[#c9d2d4]"}`}>
                                <span className={`absolute top-1 h-5 w-5 bg-white transition-transform ${state === "on" ? "translate-x-6" : "translate-x-1"}`} />
                            </span>
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
}

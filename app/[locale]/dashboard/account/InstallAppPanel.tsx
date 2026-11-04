"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const subscribe = () => () => {};

function getPlatform() {
    const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (standalone) return "installed";

    // iPadOS se presenta como Mac, pero con pantalla táctil
    const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    return isIos ? "ios" : "other";
}

export default function InstallAppPanel({ className }: { className?: string }) {
    const t = useTranslations("Account.install");
    const platform = useSyncExternalStore(subscribe, getPlatform, () => "installed");
    const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
    const [installed, setInstalled] = useState(false);

    useEffect(() => {
        const onPrompt = (event: Event) => {
            event.preventDefault();
            setInstallEvent(event as InstallEvent);
        };
        const onInstalled = () => setInstalled(true);

        window.addEventListener("beforeinstallprompt", onPrompt);
        window.addEventListener("appinstalled", onInstalled);

        return () => {
            window.removeEventListener("beforeinstallprompt", onPrompt);
            window.removeEventListener("appinstalled", onInstalled);
        };
    }, []);

    if (platform === "installed" || installed) return null;

    const install = async () => {
        if (!installEvent) return;

        await installEvent.prompt();
        await installEvent.userChoice;
        setInstallEvent(null);
    };

    return (
        <section className={className}>
            <h2 className="text-[length:var(--step-lead)] font-semibold">{t("title")}</h2>
            <p className="mt-2 max-w-[60ch]">{t("text")}</p>

            {installEvent ? (
                <button
                    type="button"
                    onClick={install}
                    className="mt-6 inline-flex min-h-12 items-center bg-[var(--brand-ink)] px-6 font-semibold text-[var(--brand-paper)] transition-opacity hover:opacity-90"
                >
                    {t("button")}
                </button>
            ) : (
                <p className="mt-4 max-w-[60ch] text-[var(--brand-muted)]">{platform === "ios" ? t("ios") : t("manual")}</p>
            )}
        </section>
    );
}

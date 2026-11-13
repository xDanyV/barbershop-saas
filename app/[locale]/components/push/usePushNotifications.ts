"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "next-intl";

// Estado de los avisos en ESTE dispositivo:
// unsupported: el navegador no los soporta · needsInstall: iPhone/iPad sin la app instalada
// unavailable: el servidor no tiene llaves · denied: la persona los bloqueó en el navegador
export type PushState = "loading" | "unsupported" | "needsInstall" | "unavailable" | "denied" | "off" | "on";

function base64UrlToBytes(value: string) {
    const padded = (value + "=".repeat((4 - (value.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(padded);
    return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

function isIosWithoutInstall() {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const standalone =
        window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    return ios && !standalone;
}

export function usePushNotifications() {
    const locale = useLocale() === "en" ? "en" : "es";
    const [state, setState] = useState<PushState>("loading");
    const [publicKey, setPublicKey] = useState<string | null>(null);
    const [working, setWorking] = useState(false);

    const refresh = useCallback(async () => {
        if (typeof window === "undefined") return;

        const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
        if (!supported) {
            setState(isIosWithoutInstall() ? "needsInstall" : "unsupported");
            return;
        }

        const res = await fetch("/api/protected/push").catch(() => null);
        const data = res?.ok ? await res.json() : null;
        if (!data?.publicKey) {
            setState("unavailable");
            return;
        }
        setPublicKey(data.publicKey);

        if (Notification.permission === "denied") {
            setState("denied");
            return;
        }

        const registration = await navigator.serviceWorker.getRegistration();
        const subscription = await registration?.pushManager.getSubscription();
        const on = Boolean(subscription && Notification.permission === "granted");

        // El dispositivo queda ligado a la cuenta con sesión y al idioma actual (si cambió alguno de los dos)
        if (on && subscription) {
            const json = subscription.toJSON();
            void fetch("/api/protected/push", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys, locale }),
            }).catch(() => null);
        }

        setState(on ? "on" : "off");
    }, [locale]);

    useEffect(() => {
        let cancelled = false;
        // El estado depende del navegador: se lee después de montar
        Promise.resolve().then(() => {
            if (!cancelled) void refresh();
        });
        return () => {
            cancelled = true;
        };
    }, [refresh]);

    const enable = useCallback(async () => {
        if (!publicKey) return false;
        setWorking(true);

        try {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                setState(permission === "denied" ? "denied" : "off");
                return false;
            }

            const registration = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"));
            await navigator.serviceWorker.ready;
            const subscription =
                (await registration.pushManager.getSubscription()) ??
                (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToBytes(publicKey) }));

            const json = subscription.toJSON();
            const res = await fetch("/api/protected/push", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys, locale }),
            });

            if (!res.ok) throw new Error("subscribe");
            setState("on");
            return true;
        } catch {
            await refresh();
            return false;
        } finally {
            setWorking(false);
        }
    }, [publicKey, locale, refresh]);

    const disable = useCallback(async () => {
        setWorking(true);

        try {
            const registration = await navigator.serviceWorker.getRegistration();
            const subscription = await registration?.pushManager.getSubscription();
            if (subscription) {
                await fetch("/api/protected/push", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ endpoint: subscription.endpoint }),
                }).catch(() => null);
                await subscription.unsubscribe();
            }
            setState("off");
        } finally {
            setWorking(false);
        }
    }, []);

    return { state, working, enable, disable };
}

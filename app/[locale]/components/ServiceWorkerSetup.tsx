"use client";

import { useEffect } from "react";

// Solo en producción: en desarrollo un service worker interfiere con la recarga de la app
export default function ServiceWorkerSetup() {
    useEffect(() => {
        if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;

        navigator.serviceWorker.register("/sw.js").catch((error) => {
            console.error("Service worker registration failed:", error);
        });
    }, []);

    return null;
}

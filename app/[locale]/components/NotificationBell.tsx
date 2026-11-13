"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

// Campana de la barra: lleva a la bandeja y muestra cuántos avisos faltan por leer
export default function NotificationBell({ className = "" }: { className?: string }) {
    const t = useTranslations("Inbox");
    const locale = useLocale();
    const pathname = usePathname();
    const [unread, setUnread] = useState(0);

    useEffect(() => {
        let cancelled = false;
        const load = () => {
            if (document.visibilityState !== "visible") return;
            fetch("/api/protected/notifications?count=1")
                .then((res) => (res.ok ? res.json() : null))
                .then((data) => {
                    if (!cancelled && data) setUnread(data.unread ?? 0);
                })
                .catch(() => null);
        };

        // Un aviso push que llega con la pantalla abierta actualiza la campana al momento
        const onWorkerMessage = (event: MessageEvent) => {
            if (event.data?.type === "notification") load();
        };

        load();
        // Además, cada 30 segundos mientras la pantalla está a la vista, y al volver a ella
        const timer = window.setInterval(load, 30_000);
        document.addEventListener("visibilitychange", load);
        window.addEventListener("inbox-read", load);
        window.addEventListener("inbox-refresh", load);
        navigator.serviceWorker?.addEventListener("message", onWorkerMessage);

        return () => {
            cancelled = true;
            window.clearInterval(timer);
            document.removeEventListener("visibilitychange", load);
            window.removeEventListener("inbox-read", load);
            window.removeEventListener("inbox-refresh", load);
            navigator.serviceWorker?.removeEventListener("message", onWorkerMessage);
        };
    }, [pathname]);

    const href = `/${locale}/dashboard/notifications`;
    const active = pathname === href;
    const label = unread > 0 ? t("bellUnread", { count: unread }) : t("bell");

    return (
        <Link
            href={href}
            aria-label={label}
            title={label}
            aria-current={active ? "page" : undefined}
            className={`relative inline-flex h-11 w-11 shrink-0 items-center justify-center transition-colors ${active ? "text-white" : "text-[#a9b7bc] hover:text-white"} ${className}`}
        >
            <Bell size={20} aria-hidden="true" />
            {unread > 0 && (
                <span
                    aria-hidden="true"
                    className="absolute right-1 top-1 flex min-w-[1.125rem] items-center justify-center bg-[#e8603a] px-1 text-[0.6875rem] font-semibold leading-[1.125rem] text-white"
                >
                    {unread > 9 ? "9+" : unread}
                </span>
            )}
        </Link>
    );
}

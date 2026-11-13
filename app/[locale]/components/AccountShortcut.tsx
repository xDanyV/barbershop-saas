"use client";

import { useEffect, useState } from "react";
import { CalendarDays, LayoutDashboard } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

type Session = { role: string; homePath: string };

// En las páginas públicas: con sesión iniciada, un acceso directo a "Mis citas" (o al panel del equipo)
export default function AccountShortcut({ className = "" }: { className?: string }) {
    const t = useTranslations("AccountShortcut");
    const locale = useLocale();
    const [session, setSession] = useState<Session | null>(null);

    useEffect(() => {
        fetch("/api/protected/session")
            .then((res) => (res.ok ? res.json() : null))
            .then((data: Session | null) => setSession(data))
            .catch(() => setSession(null));
    }, []);

    if (!session) return null;

    const isCustomer = session.role === "CUSTOMER";
    const Icon = isCustomer ? CalendarDays : LayoutDashboard;
    const label = isCustomer ? t("appointments") : t("panel");

    return (
        <a
            href={`/${locale}${session.homePath}`}
            aria-label={label}
            className={`inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 px-2 text-[length:var(--step-small)] font-semibold text-[var(--brand-ink)] transition-colors hover:text-[var(--brand-muted)] ${className}`}
        >
            <Icon size={18} aria-hidden="true" />
            <span className="hidden sm:inline">{label}</span>
        </a>
    );
}

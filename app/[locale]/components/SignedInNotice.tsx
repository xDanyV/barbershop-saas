"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type Session = { name: string | null; homePath: string };

// En pantallas de registro: si ya hay una sesión abierta, ofrece volver al panel o cerrarla
export default function SignedInNotice() {
    const t = useTranslations("SignedInNotice");
    const locale = useLocale();
    const [session, setSession] = useState<Session | null>(null);

    useEffect(() => {
        fetch("/api/protected/session")
            .then((res) => (res.ok ? res.json() : null))
            .then((data: Session | null) => setSession(data))
            .catch(() => setSession(null));
    }, []);

    if (!session) return null;

    const logout = async () => {
        await fetch("/api/logout", { method: "POST" }).catch(() => null);
        window.location.reload();
    };

    return (
        <div role="status" className="mb-6 flex flex-col gap-3 border-l-4 border-[#e8603a] bg-white/10 p-4 text-left sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">
                {session.name ? t("asName", { name: session.name }) : t("generic")} {t("hint")}
            </p>
            <div className="flex shrink-0 gap-2">
                <a href={`/${locale}${session.homePath}`} className="inline-flex min-h-11 items-center justify-center bg-[#e4dccb] px-4 text-sm font-semibold text-[#0f2733]">
                    {t("goToPanel")}
                </a>
                <button type="button" onClick={logout} className="inline-flex min-h-11 items-center justify-center border border-white/30 px-4 text-sm font-semibold">
                    {t("logout")}
                </button>
            </div>
        </div>
    );
}

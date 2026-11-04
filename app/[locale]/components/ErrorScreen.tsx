"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

// Pantalla para errores inesperados; el detalle técnico solo va a la consola
export default function ErrorScreen({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    const t = useTranslations("States");

    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div role="alert" className="mx-auto max-w-xl px-5 py-20 text-center">
            <h1 className="text-3xl font-semibold tracking-tight">{t("error.title")}</h1>
            <p className="mt-3 text-gray-600">{t("error.text")}</p>
            <button
                type="button"
                onClick={reset}
                className="mt-6 min-h-12 bg-[#0f2733] px-6 font-semibold text-white transition-opacity hover:opacity-90"
            >
                {t("error.retry")}
            </button>
        </div>
    );
}

"use client";

import { Languages } from "lucide-react";
import { useLocale } from "next-intl";

type Props = {
    // "dark": sobre fondo oscuro (barra de navegación); "light": sobre fondo claro
    tone?: "dark" | "light";
    className?: string;
};

const OTHER = { es: "en", en: "es" } as const;
const LABEL = { es: "Ver en español", en: "View in English" } as const;

// Cambia el idioma sin salir de la página: misma ruta, mismos filtros, y se recuerda la elección
export default function LocaleSwitch({ tone = "light", className = "" }: Props) {
    const locale = useLocale() === "en" ? "en" : "es";
    const next = OTHER[locale];

    const change = () => {
        document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`;
        const { pathname, search, hash } = window.location;
        const path = /^\/(es|en)(\/|$)/.test(pathname) ? pathname.replace(/^\/(es|en)/, `/${next}`) : `/${next}${pathname}`;
        window.location.assign(path + search + hash);
    };

    const colors =
        tone === "dark" ? "text-[#a9b7bc] hover:text-white" : "text-[var(--brand-muted,#4a5a61)] hover:text-[var(--brand-ink,#0f2733)]";

    return (
        <button
            type="button"
            onClick={change}
            lang={next}
            aria-label={LABEL[next]}
            title={LABEL[next]}
            className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 px-2 text-sm font-semibold transition-colors ${colors} ${className}`}
        >
            <Languages size={18} aria-hidden="true" />
            {next.toUpperCase()}
        </button>
    );
}

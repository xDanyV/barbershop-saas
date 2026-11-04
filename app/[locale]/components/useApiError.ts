"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";

// Texto para mostrar de una respuesta de error de la API. Nunca enseña el mensaje técnico en inglés.
export function useApiError() {
    const t = useTranslations("ApiErrors");

    return useCallback(
        (data: { code?: string } | null | undefined, fallback: string) =>
            data?.code && t.has(data.code) ? t(data.code) : fallback,
        [t]
    );
}

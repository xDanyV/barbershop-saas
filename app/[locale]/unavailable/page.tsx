import { getTranslations } from "next-intl/server";

// Se muestra cuando no se puede leer la sesión porque la base no responde (ver proxy.ts).
// No consulta la base, así que sigue funcionando durante el fallo.
export default async function UnavailablePage() {
    const t = await getTranslations("States");

    return (
        <main className="mx-auto flex min-h-svh max-w-xl flex-col items-center justify-center px-5 text-center">
            <h1 className="text-3xl font-semibold tracking-tight">{t("unavailable.title")}</h1>
            <p className="mt-3 text-gray-600">{t("unavailable.text")}</p>
            <p className="mt-6 text-sm text-gray-500">{t("unavailable.hint")}</p>
        </main>
    );
}

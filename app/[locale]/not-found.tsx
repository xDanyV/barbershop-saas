import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

export default async function NotFound() {
    const t = await getTranslations("States");
    const locale = await getLocale();

    return (
        <main className="mx-auto flex min-h-svh max-w-xl flex-col items-center justify-center px-5 text-center">
            <h1 className="text-3xl font-semibold tracking-tight">{t("notFound.title")}</h1>
            <p className="mt-3 text-gray-600">{t("notFound.text")}</p>
            <Link
                href={`/${locale}`}
                className="mt-6 inline-flex min-h-12 items-center bg-[#0f2733] px-6 font-semibold text-white transition-opacity hover:opacity-90"
            >
                {t("notFound.home")}
            </Link>
        </main>
    );
}

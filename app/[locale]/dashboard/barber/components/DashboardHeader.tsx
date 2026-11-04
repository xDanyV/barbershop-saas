"use client";

import { useState } from "react";
import { CalendarOff } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import AvailabilityPopover from "./AvailabilityPopover";
import ExceptionModal from "./ExceptionModal";

type Props = {
    onExceptionAdded: () => void;
};

export default function DashboardHeader({ onExceptionAdded }: Props) {
    const t = useTranslations("DashboardHeader");
    const locale = useLocale();
    const [exceptionOpen, setExceptionOpen] = useState(false);

    const today = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-MX", {
        weekday: "long",
        day: "numeric",
        month: "long",
    }).format(new Date());

    return (
        <>
            <header className="flex flex-col gap-4 py-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{t("title")}</h1>
                    <p suppressHydrationWarning className="mt-1 text-gray-500 first-letter:uppercase">
                        {today}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex">
                    <AvailabilityPopover />

                    <button
                        type="button"
                        onClick={() => setExceptionOpen(true)}
                        className="flex min-h-11 items-center justify-center gap-2 border border-gray-200 bg-white px-4 text-sm font-semibold transition-colors hover:border-gray-900"
                    >
                        <CalendarOff size={18} aria-hidden="true" />
                        {t("buttons.exceptions")}
                    </button>
                </div>
            </header>

            <ExceptionModal
                open={exceptionOpen}
                onClose={() => setExceptionOpen(false)}
                onSuccess={onExceptionAdded}
            />
        </>
    );
}

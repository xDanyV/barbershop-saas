import { Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import AppointmentCard from "./AppointmentCard";

type Appointment = {
    id: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    service: string;
    time: string;
    date: string;
    isWalkIn: boolean;
    status: "PENDING" | "CONFIRMED" | "COMPLETED" | "NO_SHOW";
    businessName: string;
    businessSlug: string;
};

type Exception = {
    startDate: string;
    endDate: string;
};

type Props = {
    appointments: Appointment[];
    loading?: boolean;
    onConfirm?: (id: string) => void;
    onChanged?: () => void;
    onAddWalkIn?: () => void;
    selectedDate: string;
    exceptions?: Exception[];
};

export default function AppointmentList({ appointments, loading = false, onConfirm, onChanged, onAddWalkIn, selectedDate, exceptions = [] }: Props) {
    const t = useTranslations("AppointmentList");
    const tWalkIn = useTranslations("WalkIn");
    const locale = useLocale();

    const [year, month, day] = selectedDate.split("-").map(Number);
    const formattedDate = new Date(year, month - 1, day).toLocaleDateString(locale === "en" ? "en-US" : "es-MX", {
        weekday: "long",
        day: "numeric",
        month: "long",
    });

    const isExceptionDay = exceptions.some(
        (e) => selectedDate >= e.startDate.split("T")[0] && selectedDate <= e.endDate.split("T")[0]
    );

    return (
        <section className="bg-white p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h2 className="text-xl font-semibold first-letter:uppercase">{formattedDate}</h2>
                    <p className="text-sm text-gray-500">{t("count", { count: appointments.length })}</p>
                </div>

                {onAddWalkIn && (
                    <button
                        type="button"
                        onClick={onAddWalkIn}
                        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 bg-gray-900 px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    >
                        <Plus size={18} aria-hidden="true" />
                        {tWalkIn("button")}
                    </button>
                )}
            </div>

            {isExceptionDay && (
                <div className="mt-4 bg-amber-50 p-3 text-sm">
                    <p className="font-semibold">{t("exceptionDay.title")}</p>
                    <p className="text-gray-600">{t("exceptionDay.subtitle")}</p>
                </div>
            )}

            {loading ? (
                <div role="status" aria-busy="true" className="mt-4 animate-pulse space-y-3">
                    <span className="sr-only">{t("loading")}</span>
                    {[1, 2, 3].map((item) => (
                        <div key={item} className="h-20 bg-gray-100" />
                    ))}
                </div>
            ) : appointments.length === 0 ? (
                !isExceptionDay && <p className="mt-6 py-10 text-center text-gray-500">{t("empty.title")}</p>
            ) : (
                <ul className="mt-4 divide-y divide-gray-100">
                    {appointments.map((appointment) => (
                        <li key={appointment.id}>
                            <AppointmentCard appointment={appointment} onConfirm={onConfirm} onChanged={onChanged} />
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

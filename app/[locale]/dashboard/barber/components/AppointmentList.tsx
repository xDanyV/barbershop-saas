import AppointmentCard from "./AppointmentCard";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Inbox, Ban } from "lucide-react";
import { useTranslations } from "next-intl";

type Appointment = {
    id: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    service: string;
    time: string;
    status: "PENDING" | "CONFIRMED" | "COMPLETED";
};

type Exception = {
    startDate: string;
    endDate: string;
};

type Props = {
    appointments: Appointment[];
    onConfirm?: (id: string) => void;
    selectedDate: string;
    exceptions?: Exception[];
};

export default function AppointmentList({ appointments, onConfirm, selectedDate, exceptions = [] }: Props) {
    const t = useTranslations("AppointmentList");

    const dateToProcess = selectedDate || new Date().toISOString().split("T")[0];
    const [year, month, day] = dateToProcess.split("-").map(Number);
    const localDate = new Date(year, month - 1, day);

    const formattedDate = localDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
    });

    const isExceptionDay = exceptions.some((e) => {
        const currentDate = new Date(year, month - 1, day);
        currentDate.setHours(0, 0, 0, 0);

        const [sYear, sMonth, sDay] = e.startDate.split("T")[0].split("-").map(Number);
        const [eYear, eMonth, eDay] = e.endDate.split("T")[0].split("-").map(Number);

        const start = new Date(sYear, sMonth - 1, sDay, 0, 0, 0, 0);
        const end = new Date(eYear, eMonth - 1, eDay, 23, 59, 59, 999);

        return currentDate >= start && currentDate <= end;
    });

    return (
        <div className="bg-white border border-gray-100 rounded-4xl md:rounded-[2.5rem] p-5 md:p-8 shadow-xl shadow-gray-100/50 min-h-137.5 flex flex-col">
            {/* Header */}
            <div className="flex flex-col mb-6 md:mb-8 gap-1">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                        {t("title")}
                    </h2>
                    <motion.span
                        key={appointments.length}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-indigo-50 text-indigo-600 px-3 md:px-4 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest"
                    >
                        {appointments.length} Total
                    </motion.span>
                </div>

                <div className="flex items-center gap-2 text-gray-400 text-xs md:text-sm font-medium">
                    <Calendar size={14} className="text-indigo-400 shrink-0" />
                    <span className="truncate">
                        {t("scheduleFor")} <span className="text-gray-700 font-bold">{formattedDate}</span>
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-104 pr-2">
                <AnimatePresence mode="popLayout">

                    {isExceptionDay ? (
                        <motion.div
                            key="exception"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-16 md:py-24 text-center"
                        >
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-purple-50 rounded-3xl md:rounded-4xl flex items-center justify-center mb-4 border border-purple-100">
                                <Ban className="text-purple-300" size={28} />
                            </div>
                            <p className="text-gray-700 font-semibold text-sm md:text-base">{t("exceptionDay.title")}</p>
                            <p className="text-gray-400 text-[10px] md:text-xs uppercase tracking-tighter mt-1 font-bold">
                                {t("exceptionDay.subtitle")}
                            </p>
                        </motion.div>

                    ) : appointments.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-16 md:py-24 text-center"
                        >
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-50 rounded-3xl md:rounded-4xl flex items-center justify-center mb-4 border border-gray-100">
                                <Inbox className="text-gray-200" size={28} />
                            </div>
                            <p className="text-gray-400 font-semibold text-sm md:text-base">{t("empty.title")}</p>
                            <p className="text-gray-300 text-[10px] md:text-xs uppercase tracking-tighter mt-1 font-bold">
                                {t("empty.subtitle")}
                            </p>
                        </motion.div>

                    ) : (
                        <div className="grid grid-cols-1 gap-3 md:gap-4">
                            {appointments.map((appointment, idx) => (
                                <motion.div
                                    key={appointment.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ delay: idx * 0.04, ease: "easeOut" }}
                                >
                                    <AppointmentCard
                                        appointment={appointment}
                                        onConfirm={onConfirm}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
}
"use client";

import { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { toast } from "react-hot-toast";
import { X, Info } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
};

export default function ExceptionModal({ open, onClose, onSuccess }: Props) {
    const t = useTranslations("ExceptionModal");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [reason, setReason] = useState("");
    const [saving, setSaving] = useState(false);

    const handleClose = () => {
        if (saving) return;
        setStartDate("");
        setEndDate("");
        setReason("");
        onClose();
    };

    const handleSave = async () => {
        if (!startDate || !endDate) {
            toast.error(t("errors.missingDates"));
            return;
        }

        const [sy, sm, sd] = startDate.split("-").map(Number);
        const [ey, em, ed] = endDate.split("-").map(Number);
        const start = new Date(sy, sm - 1, sd);
        const end = new Date(ey, em - 1, ed);

        if (start > end) {
            toast.error(t("errors.invalidDates"));
            return;
        }

        const loadingToast = toast.loading(t("toasts.saving"));
        setSaving(true);

        try {
            const res = await fetch("/api/protected/exceptions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ startDate, endDate, reason }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error ?? t("errors.server"), { id: loadingToast });
                return;
            }

            if (data.cancelledCount > 0) {
                toast.success(
                    t("toasts.successWithCancellations", { count: data.cancelledCount }),
                    { id: loadingToast, duration: 6000 }
                );
            } else {
                toast.success(t("toasts.successClean"), { id: loadingToast });
            }

            onSuccess();
            handleClose();
        } catch {
            toast.error(t("errors.connection"), { id: loadingToast });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Transition appear show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>

                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
                    leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                        leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
                    >
                        <Dialog.Panel className="w-full max-w-[95vw] sm:max-w-md bg-white rounded-3xl shadow-2xl p-5 md:p-6 overflow-hidden">

                            <div className="flex items-center justify-between mb-4 md:mb-5">
                                <Dialog.Title className="text-base md:text-lg font-black text-gray-900">
                                    {t("title")}
                                </Dialog.Title>
                                <button
                                    onClick={handleClose}
                                    disabled={saving}
                                    className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition cursor-pointer disabled:opacity-40"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <p className="text-xs md:text-sm text-gray-500 mb-5 leading-relaxed font-medium">
                                {t("description")}
                            </p>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">
                                            {t("fields.startDate")}
                                        </label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            min={new Date().toISOString().split("T")[0]}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full border border-gray-100 bg-gray-50 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400/50 appearance-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">
                                            {t("fields.endDate")}
                                        </label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            min={startDate || new Date().toISOString().split("T")[0]}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full border border-gray-100 bg-gray-50 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400/50 appearance-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">
                                        {t("fields.reason")}
                                    </label>
                                    <input
                                        type="text"
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder={t("fields.reasonPlaceholder")}
                                        className="w-full border border-gray-100 bg-gray-50 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                                    />
                                </div>

                                <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100/50">
                                    <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                                        {t.rich("warning", {
                                            strong: (chunks) => <strong>{chunks}</strong>
                                        })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
                                <button
                                    onClick={handleClose}
                                    disabled={saving}
                                    className="w-full sm:flex-1 py-3 sm:py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition cursor-pointer disabled:opacity-40"
                                >
                                    {t("buttons.cancel")}
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving || !startDate || !endDate}
                                    className="w-full sm:flex-1 py-3 sm:py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition cursor-pointer disabled:opacity-60 shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                            <span>{t("buttons.saving")}</span>
                                        </>
                                    ) : (
                                        t("buttons.save")
                                    )}
                                </button>
                            </div>

                        </Dialog.Panel>
                    </Transition.Child>
                </div>

            </Dialog>
        </Transition>
    );
}
"use client";

import { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { toast } from "react-hot-toast";
import { X } from "lucide-react";

type Props = {
    open: boolean;
    onClose: () => void;
};

export default function ExceptionModal({ open, onClose }: Props) {
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
            toast.error("Please select start and end dates");
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            toast.error("Start date cannot be after end date");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch("/api/protected/exceptions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ startDate, endDate, reason }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error ?? "Failed to save exception");
                return;
            }

            toast.success("Exception saved — affected appointments have been cancelled");
            handleClose();

        } catch {
            toast.error("Network error, please try again");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Transition appear show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>

                {/* Fondo borroso */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </Transition.Child>

                {/* Panel centrado */}
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-200"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-150"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                    >
                        <Dialog.Panel className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">

                            {/* Header */}
                            <div className="flex items-center justify-between mb-5">
                                <Dialog.Title className="text-lg font-semibold text-gray-800">
                                    Add Exception
                                </Dialog.Title>
                                <button
                                    onClick={handleClose}
                                    disabled={saving}
                                    className="text-gray-400 hover:text-gray-600 transition cursor-pointer disabled:opacity-40"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <p className="text-sm text-gray-500 mb-5">
                                Select a date range to block. All pending and confirmed appointments within this range will be automatically cancelled.
                            </p>

                            <div className="space-y-4">

                                {/* Date range */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 mb-1 block">
                                            Start date
                                        </label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            min={new Date().toISOString().split("T")[0]}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 mb-1 block">
                                            End date
                                        </label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            min={startDate || new Date().toISOString().split("T")[0]}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                        />
                                    </div>
                                </div>

                                {/* Reason */}
                                <div>
                                    <label className="text-xs font-medium text-gray-500 mb-1 block">
                                        Reason (optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="e.g. Vacation, Emergency..."
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    />
                                </div>

                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleClose}
                                    disabled={saving}
                                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer disabled:opacity-40"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving || !startDate || !endDate}
                                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Apply Exception"
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
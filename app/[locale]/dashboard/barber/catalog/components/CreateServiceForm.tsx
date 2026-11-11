"use client";

import { useState } from "react";
import { notifyBarberSetupChanged } from "../../setup-events";
import { motion } from "framer-motion";
import { Scissors, DollarSign, Clock, PlusCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { useApiError } from "@/[locale]/components/useApiError";

type Props = {
    setView: (view: "list") => void;
    // Solo el dueño puede crear el servicio para todo su equipo de una vez
    canApplyToTeam?: boolean;
};

export default function CreateServiceForm({ setView, canApplyToTeam = false }: Props) {
    const t = useTranslations("CreateServiceForm");
    const apiError = useApiError();
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [duration, setDuration] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [applyToTeam, setApplyToTeam] = useState(false);

    const inputStyles = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all placeholder:text-gray-400 text-gray-900 font-medium";

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/protected/catalog", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, price: Number(price), duration: Number(duration), applyToTeam: canApplyToTeam && applyToTeam }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) {
                toast.error(apiError(data, t("errors.failed")));
                return;
            }
            if (canApplyToTeam && applyToTeam) toast.success(t("teamCreated", { count: data?.created ?? 0 }));
            notifyBarberSetupChanged();
            setView("list");
        } catch (error) {
            console.error("Error creating service:", error);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="bg-white border border-gray-100 rounded-3xl shadow-xl shadow-gray-100 p-6 md:p-8 space-y-6 w-full max-w-[95vw] sm:max-w-md mx-auto"
        >
            <div className="text-center sm:text-left">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 mx-auto sm:mx-0">
                    <PlusCircle size={28} />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">{t("title")}</h2>
                <p className="text-xs md:text-sm text-gray-500">{t("subtitle")}</p>
            </div>

            <div className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold   text-gray-400 ml-1 flex items-center gap-2">
                        <Scissors size={12} /> {t("fields.name")}
                    </label>
                    <input
                        placeholder={t("fields.namePlaceholder")}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={`${inputStyles} text-base md:text-sm py-3`}
                        required
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold   text-gray-400 ml-1 flex items-center gap-2">
                            <DollarSign size={12} /> {t("fields.price")}
                        </label>
                        <input
                            type="number"
                            placeholder="0.00"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className={`${inputStyles} text-base md:text-sm py-3`}
                            required
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold   text-gray-400 ml-1 flex items-center gap-2">
                            <Clock size={12} /> {t("fields.duration")}
                        </label>
                        <input
                            type="number"
                            placeholder="30"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            className={`${inputStyles} text-base md:text-sm py-3`}
                            required
                        />
                    </div>
                </div>
            </div>

            <div className="pt-2 flex flex-col gap-3">
                {canApplyToTeam && (
                <label className="flex min-h-11 items-center gap-3 text-sm font-semibold text-gray-700">
                    <input type="checkbox" checked={applyToTeam} onChange={(e) => setApplyToTeam(e.target.checked)} className="h-5 w-5 accent-[#0f2733]" />
                    {t("applyToTeam")}
                </label>
            )}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-indigo-600 text-white py-3.5 md:py-4 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                >
                    {isSubmitting ? t("buttons.creating") : t("buttons.create")}
                </button>
                <button
                    type="button"
                    onClick={() => setView("list")}
                    className="w-full bg-white text-gray-500 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all text-sm md:text-base"
                >
                    {t("buttons.cancel")}
                </button>
            </div>
        </motion.form>
    );
}
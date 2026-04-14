"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Scissors, DollarSign, Clock, PlusCircle } from "lucide-react";

type Props = {
    setView: (view: "list") => void;
};

export default function CreateServiceForm({ setView }: Props) {
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [duration, setDuration] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const inputStyles = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all placeholder:text-gray-400 text-gray-900 font-medium";

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/protected/catalog", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-user-role": "BARBER",
                },
                body: JSON.stringify({
                    name,
                    price: Number(price),
                    duration: Number(duration),
                }),
            });

            if (!res.ok) throw new Error("Failed to create service");
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
            // Ajuste de max-width y padding para móviles
            className="bg-white border border-gray-100 rounded-3xl shadow-xl shadow-gray-100 p-6 md:p-8 space-y-6 w-full max-w-[95vw] sm:max-w-md mx-auto"
        >
            <div className="text-center sm:text-left">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 mx-auto sm:mx-0">
                    <PlusCircle size={28} />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">New Service</h2>
                <p className="text-xs md:text-sm text-gray-500">Define the details for your new catalog entry.</p>
            </div>

            <div className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-gray-400 ml-1 flex items-center gap-2">
                        <Scissors size={12} /> Service Name
                    </label>
                    <input
                        placeholder="e.g. Skin Fade & Beard"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        // Asegúrate de que inputStyles tenga text-base (16px) en móvil para evitar zoom
                        className={`${inputStyles} text-base md:text-sm py-3`}
                        required
                    />
                </div>

                {/* Grid col-1 en móviles muy pequeños o mantenido en 2 si los labels son cortos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-gray-400 ml-1 flex items-center gap-2">
                            <DollarSign size={12} /> Price
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
                        <label className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-gray-400 ml-1 flex items-center gap-2">
                            <Clock size={12} /> Minutes
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
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-indigo-600 text-white py-3.5 md:py-4 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                >
                    {isSubmitting ? "Creating..." : "Create Service"}
                </button>
                <button
                    type="button"
                    onClick={() => setView("list")}
                    className="w-full bg-white text-gray-500 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all text-sm md:text-base"
                >
                    Cancel
                </button>
            </div>
        </motion.form>
    );
}
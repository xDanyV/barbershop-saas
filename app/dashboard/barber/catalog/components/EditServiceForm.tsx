"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Edit3, DollarSign, Clock, Save, X } from "lucide-react";

type Service = {
    id: string;
    name: string;
    price: number;
    duration: number;
};

type Props = {
    service: Service;
    onCancel: () => void;
    onSuccess: () => void;
};

export default function EditServiceForm({ service, onCancel, onSuccess }: Props) {
    const [name, setName] = useState(service.name);
    const [price, setPrice] = useState(service.price);
    const [duration, setDuration] = useState(service.duration);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const inputStyles = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all placeholder:text-gray-400 text-gray-900 font-medium";

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch(`/api/protected/catalog/${service.id}`, {
                method: "PATCH",
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

            if (res.ok) {
                onSuccess();
            }
        } catch (error) {
            console.error("Update failed", error);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <motion.form
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onSubmit={handleSubmit}
            className="bg-white border border-gray-100 rounded-3xl shadow-xl shadow-gray-100 p-8 space-y-6 w-full max-w-md mx-auto"
        >
            <div className="flex justify-between items-start">
                <div>
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
                        <Edit3 size={28} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Edit Service</h2>
                    <p className="text-sm text-gray-500">Modify the details for this service.</p>
                </div>
                <button
                    type="button"
                    onClick={onCancel}
                    className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1 flex items-center gap-2">
                        Service Name
                    </label>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Service name"
                        className={inputStyles}
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1 flex items-center gap-2">
                            <DollarSign size={12} /> Price
                        </label>
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(Number(e.target.value))}
                            placeholder="Price"
                            className={inputStyles}
                            required
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1 flex items-center gap-2">
                            <Clock size={12} /> Duration (min)
                        </label>
                        <input
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value))}
                            placeholder="Duration"
                            className={inputStyles}
                            required
                        />
                    </div>
                </div>
            </div>

            <div className="pt-2 flex flex-col gap-3">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                    <Save size={18} />
                    {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="w-full bg-gray-50 text-gray-500 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all"
                >
                    Discard Changes
                </button>
            </div>
        </motion.form>
    );
}
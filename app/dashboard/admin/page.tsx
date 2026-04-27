"use client";

import { useEffect, useState } from "react";
import { Check, X, User, Mail, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminDashboard() {
    const [barbers, setBarbers] = useState<any[]>([]); // Forzamos tipo array
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPending = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/barbers");

            if (!res.ok) {
                setError(`Error ${res.status}: ${res.statusText}`);
                setBarbers([]);
                return;
            }

            const data = await res.json();
            if (!Array.isArray(data)) {
                setBarbers([]);
                setError("Data format error");
            } else {
                setBarbers(data);
                setError(null);
            }
        } catch (err) {
            console.error("Fetch error:", err);
            setError("Connection error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const handleAction = async (barberId: string, status: string) => {
        try {
            const res = await fetch("/api/admin/barbers", {
                method: "PATCH",
                body: JSON.stringify({ barberId, status }),
            });
            if (res.ok) fetchPending();
        } catch (err) {
            console.error("Action error:", err);
        }
    };

    if (loading) return <div className="p-10 text-center font-bold text-gray-400">Loading admin panel...</div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Admin Control</h1>
                <p className="text-gray-500 font-medium">Verify and manage new professional registrations.</p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl font-bold">
                    Error: {error}
                </div>
            )}

            <div className="grid gap-4">
                <AnimatePresence mode="popLayout">
                    {/* Usamos Array.isArray() aquí también por seguridad extrema */}
                    {Array.isArray(barbers) && barbers.length === 0 ? (
                        <p className="text-center py-10 text-gray-400 font-bold italic">No pending approvals.</p>
                    ) : (
                        Array.isArray(barbers) && barbers.map((barber: any) => (
                            <motion.div
                                key={barber.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                className="bg-white border border-gray-100 p-6 rounded-4xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-gray-900">{barber.user?.name || "No name"}</h3>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                            <span className="text-xs text-gray-400 flex items-center gap-1"><Mail size={12} /> {barber.user?.email}</span>
                                            <span className="text-xs text-gray-400 flex items-center gap-1"><Phone size={12} /> {barber.user?.phone}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleAction(barber.id, "APPROVED")}
                                        className="flex-1 md:flex-none flex items-center gap-2 px-5 py-2.5 bg-green-50 text-green-600 rounded-xl font-bold text-sm hover:bg-green-100 transition-colors"
                                    >
                                        <Check size={18} /> Approve
                                    </button>
                                    <button
                                        onClick={() => handleAction(barber.id, "REJECTED")}
                                        className="flex-1 md:flex-none flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors"
                                    >
                                        <X size={18} /> Reject
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
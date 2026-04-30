"use client";

import { useEffect, useState } from "react";
import { Mail, Phone, ShieldCheck, Ban } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

export default function ActiveBarbersList() {
    const [barbers, setBarbers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchManaged = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/barbers/active");

            if (!res.ok) {
                toast.error(`Error al cargar datos: ${res.statusText}`);
                setBarbers([]);
                return;
            }

            const data = await res.json();
            if (!Array.isArray(data)) {
                setBarbers([]);
                toast.error("Error en el formato de los datos");
            } else {
                setBarbers(data);
            }
        } catch (err) {
            console.error("Fetch error:", err);
            toast.error("Error de conexión con el servidor");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchManaged();
    }, []);

    const executeStatusChange = async (barberId: string, newStatus: string, statusLabel: string) => {
        const loadingToast = toast.loading("Actualizando estado...");

        try {
            const res = await fetch("/api/admin/barbers", {
                method: "PATCH",
                body: JSON.stringify({ barberId, status: newStatus }),
            });

            if (res.ok) {
                toast.success(`Estado actualizado a ${statusLabel}`, { id: loadingToast });
                fetchManaged();
            } else {
                toast.error("Error al actualizar el estado", { id: loadingToast });
                fetchManaged();
            }
        } catch (err) {
            console.error("Action error:", err);
            toast.error("Error de conexión", { id: loadingToast });
            fetchManaged();
        }
    };

    const handleStatusChange = (barberId: string, newStatus: string) => {
        const statusLabels: Record<string, string> = {
            PENDING: "Pendiente",
            APPROVED: "Activo",
            REJECTED: "Bloqueado"
        };

        const targetLabel = statusLabels[newStatus];


        toast((t) => (
            <div className="flex flex-col gap-3">
                <p className="text-sm font-medium text-gray-900">
                    ¿Cambiar estado a <span className="font-bold text-indigo-600">{targetLabel}</span>?
                </p>
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            fetchManaged(); 
                        }}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            executeStatusChange(barberId, newStatus, targetLabel); 
                        }}
                        className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        ), {
            duration: 8000, 
            id: `confirm-${barberId}` 
        });
    };

    if (loading) return <div className="p-10 text-center font-bold text-gray-400">Cargando directorio de barberos...</div>;

    return (
        <div className="space-y-6">
            <div className="grid gap-4">
                <AnimatePresence mode="popLayout">
                    {Array.isArray(barbers) && barbers.length === 0 ? (
                        <p className="text-center py-10 text-gray-400 font-bold italic">No hay barberos gestionados en el sistema.</p>
                    ) : (
                        Array.isArray(barbers) && barbers.map((barber: any) => {
                            const isApproved = barber.status === "APPROVED";

                            return (
                                <motion.div
                                    key={barber.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className={`bg-white border p-6 rounded-4xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors ${isApproved ? "border-gray-100" : "border-red-100 bg-red-50/30"
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isApproved ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
                                            }`}>
                                            {isApproved ? <ShieldCheck size={24} /> : <Ban size={24} />}
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
                                        {barber.isSelf ? (
                                            <span className="px-4 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm border border-indigo-100">
                                                Tu Cuenta (Admin)
                                            </span>
                                        ) : (
                                            <select
                                                value={barber.status}
                                                onChange={(e) => handleStatusChange(barber.id, e.target.value)}
                                                className={`px-4 py-2.5 bg-white border rounded-xl font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer transition-colors ${isApproved ? "border-gray-200 text-gray-700" : "border-red-200 text-red-600"
                                                    }`}
                                            >
                                                <option value="APPROVED">🟢 Activo</option>
                                                <option value="PENDING">🟠 Pendiente</option>
                                                <option value="REJECTED">🔴 Bloqueado</option>
                                            </select>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
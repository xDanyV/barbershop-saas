"use client";

import { useEffect, useState } from "react";
import { Search, User, Mail, Phone, CalendarDays, Ban, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

export default function CustomersList() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/customers");

            if (!res.ok) {
                toast.error("Error al cargar la lista de clientes");
                return;
            }

            const data = await res.json();
            if (Array.isArray(data)) {
                setCustomers(data);
                setFilteredCustomers(data);
            }
        } catch (err) {
            console.error("Fetch error:", err);
            toast.error("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredCustomers(customers);
            return;
        }

        const lowerCaseTerm = searchTerm.toLowerCase();
        const filtered = customers.filter(c =>
            (c.name && c.name.toLowerCase().includes(lowerCaseTerm)) ||
            (c.email && c.email.toLowerCase().includes(lowerCaseTerm)) ||
            (c.phone && c.phone.includes(lowerCaseTerm))
        );
        setFilteredCustomers(filtered);
    }, [searchTerm, customers]);

    // Lógica para bloquear/desbloquear
    const executeBanToggle = async (customerId: string, willBan: boolean) => {
        const loadingToast = toast.loading(willBan ? "Bloqueando cliente..." : "Desbloqueando cliente...");

        try {
            const res = await fetch("/api/admin/customers", {
                method: "PATCH",
                body: JSON.stringify({ customerId, isBanned: willBan }),
            });

            if (res.ok) {
                toast.success(willBan ? "Cliente bloqueado (No podrá agendar)" : "Cliente desbloqueado", { id: loadingToast });
                fetchCustomers();
            } else {
                toast.error("Error al actualizar el estado", { id: loadingToast });
            }
        } catch (err) {
            console.error("Action error:", err);
            toast.error("Error de conexión", { id: loadingToast });
        }
    };

    const handleBanToggle = (customerId: string, isCurrentlyBanned: boolean) => {
        const actionText = isCurrentlyBanned ? "DESBLOQUEAR" : "BLOQUEAR";
        const willBan = !isCurrentlyBanned;

        toast((t) => (
            <div className="flex flex-col gap-3">
                <p className="text-sm font-medium text-gray-900">
                    ¿Seguro que deseas <span className={`font-bold ${willBan ? "text-red-600" : "text-green-600"}`}>{actionText}</span> a este cliente?
                </p>
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            executeBanToggle(customerId, willBan);
                        }}
                        className={`px-3 py-1.5 text-white text-xs font-bold rounded-lg transition-colors shadow-sm ${willBan ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                            }`}
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        ), { duration: 8000, id: `ban-confirm-${customerId}` });
    };

    if (loading) return <div className="p-10 text-center font-bold text-gray-400">Cargando base de clientes...</div>;

    return (
        <div className="space-y-6">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <Search size={20} />
                </div>
                <input
                    type="text"
                    placeholder="Buscar cliente por nombre, email o teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                />
            </div>

            <div className="grid gap-4">
                <AnimatePresence mode="popLayout">
                    {filteredCustomers.length === 0 ? (
                        <p className="text-center py-10 text-gray-400 font-bold italic">No se encontraron clientes.</p>
                    ) : (
                        filteredCustomers.map((customer: any) => (
                            <motion.div
                                key={customer.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className={`border p-6 rounded-4xl shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:shadow-md transition-all ${customer.isBanned ? "bg-red-50/40 border-red-100" : "bg-white border-gray-100"
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${customer.isBanned ? "bg-red-100 text-red-500" : "bg-blue-50 text-blue-500"
                                        }`}>
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-gray-900 flex items-center gap-2">
                                            {customer.name || "Sin nombre registrado"}
                                            {customer.isBanned && (
                                                <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase tracking-widest">Bloqueado</span>
                                            )}
                                        </h3>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                                <Mail size={12} /> {customer.email}
                                            </span>
                                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                                <Phone size={12} /> {customer.phone}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Métrica de Citas */}
                                    <div className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100">
                                        <CalendarDays size={18} className="text-indigo-500" />
                                        <div className="flex flex-col">
                                            <span className="text-base font-black leading-none">{customer._count?.appointments || 0}</span>
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Citas</span>
                                        </div>
                                    </div>

                                    {/* Botón de Acción */}
                                    <button
                                        onClick={() => handleBanToggle(customer.id, customer.isBanned)}
                                        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors ${customer.isBanned
                                                ? "bg-green-50 text-green-600 hover:bg-green-100 border border-green-100"
                                                : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-50"
                                            }`}
                                    >
                                        {customer.isBanned ? (
                                            <><CheckCircle2 size={18} /> Permitir Citas</>
                                        ) : (
                                            <><Ban size={18} /> Bloquear</>
                                        )}
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
"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, Clock, User, Scissors } from "lucide-react";
import { motion } from "framer-motion";

type Appointment = {
  id: string;
  customerName: string;
  service: string;
  time: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED";
};

type Props = {
  appointment: Appointment;
  onConfirm?: (id: string) => void;
};

export default function AppointmentCard({ appointment, onConfirm }: Props) {
  const [status, setStatus] = useState(appointment.status);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/protected/appointments/${appointment.id}/confirm`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONFIRMED" }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Could not confirm appointment");
        return;
      }

      setStatus("CONFIRMED");
      // Notificamos al padre para que refresque la lista si es necesario
      onConfirm?.(appointment.id);
      toast.success(`${appointment.customerName} confirmed for ${appointment.time}`);

    } catch {
      toast.error("Network error, please try again");
    } finally {
      setLoading(false);
    }
  };

  const statusStyles = {
    CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-100",
    COMPLETED: "bg-gray-50 text-gray-500 border-gray-100",
    PENDING: "bg-amber-50 text-amber-700 border-amber-100",
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="group border border-gray-100 rounded-2xl p-4 flex justify-between items-center bg-white shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-200"
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${status === "PENDING" ? "bg-amber-50 text-amber-500" : "bg-indigo-50 text-indigo-500"
          }`}>
          {status === "COMPLETED" ? <CheckCircle2 size={20} /> : <User size={20} />}
        </div>

        <div>
          <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
            {appointment.customerName}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
            <span className="flex items-center gap-1">
              <Scissors size={12} />
              {appointment.service}
            </span>
          </div>
        </div>
      </div>

      <div className="text-right flex flex-col items-end gap-2">
        <div className="flex items-center gap-1.5 text-sm font-bold text-gray-700 bg-gray-50 px-2 py-1 rounded-lg">
          <Clock size={14} className="text-indigo-500" />
          {appointment.time}
        </div>

        <div className="flex gap-2 items-center">
          <span
            className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${statusStyles[status as keyof typeof statusStyles]
              }`}
          >
            {status}
          </span>

          {status === "PENDING" && (
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="text-xs px-4 py-1.5 rounded-full bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? "..." : "Confirm"}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
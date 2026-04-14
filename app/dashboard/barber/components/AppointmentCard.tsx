"use client";

import { useState, Fragment } from "react";
import toast from "react-hot-toast";
import {
  CheckCircle2,
  Clock,
  User,
  Scissors,
  Mail,
  Phone,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react";

type Appointment = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  service: string;
  time: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED";
};

type Props = {
  appointment: Appointment;
  onConfirm?: (id: string) => void;
};

export default function AppointmentCard({
  appointment,
  onConfirm,
}: Props) {
  const [status, setStatus] = useState(appointment.status);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        `/api/protected/appointments/${appointment.id}/confirm`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "CONFIRMED" }),
        }
      );

      if (!res.ok) {
        toast.error("Could not confirm appointment");
        return;
      }

      setStatus("CONFIRMED");
      onConfirm?.(appointment.id);
      toast.success(`Cita de ${appointment.customerName} confirmada`);
    } catch {
      toast.error("Error de red");
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
    <Popover className="relative">
      {({ open }) => (
        <motion.div
          whileHover={{ y: -2 }}
          className={`relative border border-gray-100 rounded-2xl p-3 md:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white shadow-sm hover:shadow-md transition-all duration-200 gap-4 ${open ? "z-50" : "z-0 hover:z-20"
            }`}
        >
          <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto">
            <PopoverButton className="flex items-center gap-3 md:gap-4 focus:outline-none group/btn text-left cursor-pointer min-w-0 flex-1">
              <div
                className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center transition-colors ${status === "PENDING"
                    ? "bg-amber-50 text-amber-500"
                    : "bg-indigo-50 text-indigo-500"
                  }`}
              >
                {status === "COMPLETED" ? (
                  <CheckCircle2 size={20} />
                ) : (
                  <User size={20} />
                )}
              </div>

              <div className="min-w-0">
                <p className="font-bold text-gray-900 group-hover/btn:text-indigo-600 transition-colors flex items-center gap-1 text-sm md:text-base">
                  <span className="truncate">{appointment.customerName}</span>
                  <ExternalLink
                    size={12}
                    className="opacity-0 group-hover/btn:opacity-100 transition-opacity text-gray-400 shrink-0"
                  />
                </p>

                <div className="flex items-center gap-2 text-[11px] md:text-xs text-gray-500 mt-0.5">
                  <span className="flex items-center gap-1 truncate">
                    <Scissors size={12} className="shrink-0" />
                    {appointment.service}
                  </span>
                </div>
              </div>
            </PopoverButton>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <PopoverPanel className="absolute left-0 sm:left-12 top-full z-50 mt-3 w-[calc(100vw-3rem)] sm:w-64 px-0 sm:px-4">
                <div className="overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/5 bg-white p-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                    Detalles del Cliente
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between group/item">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <Phone size={14} />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs text-gray-400 font-medium leading-none">
                            Teléfono
                          </p>
                          <p className="text-sm font-bold text-gray-700 truncate">
                            {appointment.customerPhone || "No provisto"}
                          </p>
                        </div>
                      </div>

                      {appointment.customerPhone && (
                        <a
                          href={`https://wa.me/${appointment.customerPhone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-gray-50 text-gray-400 hover:bg-emerald-500 hover:text-white transition-all shrink-0"
                        >
                          <MessageCircle size={14} />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Mail size={14} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs text-gray-400 font-medium leading-none">
                          Email
                        </p>
                        <p className="text-sm font-bold text-gray-700 truncate">
                          {appointment.customerEmail || "No provisto"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </PopoverPanel>
            </Transition>
          </div>

          <div className="text-left sm:text-right flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-50">
            <div className="flex items-center gap-1.5 text-xs md:text-sm font-bold text-gray-700 bg-gray-50 px-2 py-1 rounded-lg">
              <Clock size={14} className="text-indigo-500" />
              {appointment.time}
            </div>

            <div className="flex gap-2 items-center">
              <span
                className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border shrink-0 ${statusStyles[status]
                  }`}
              >
                {status}
              </span>

              {status === "PENDING" && (
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="text-[11px] md:text-xs px-3 md:px-4 py-1.5 rounded-full bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all cursor-pointer whitespace-nowrap"
                >
                  {loading ? "..." : "Confirmar"}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </Popover>
  );
}
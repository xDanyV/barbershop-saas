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
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react";
import { useTranslations } from "next-intl";

type AppointmentStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

type Appointment = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  service: string;
  time: string;
  status: AppointmentStatus;
};

type Props = {
  appointment: Appointment;
  onConfirm?: (id: string) => void;
  onCancel?: (id: string) => void;
};

export default function AppointmentCard({
  appointment,
  onConfirm,
  onCancel,
}: Props) {
  const t = useTranslations("AppointmentCard");
  const [status, setStatus] = useState<AppointmentStatus>(appointment.status);
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState(false);

  const handleConfirm = async () => {
    setLoadingConfirm(true);

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
        toast.error(t("errors.confirmFailed"));
        return;
      }

      setStatus("CONFIRMED");
      onConfirm?.(appointment.id);
      toast.success(t("success.confirmed", { name: appointment.customerName }));
    } catch {
      toast.error(t("errors.network"));
    } finally {
      setLoadingConfirm(false);
    }
  };

  const executeCancel = async () => {
    setLoadingCancel(true);

    try {
      const res = await fetch(`/api/protected/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(data?.error || "No se pudo cancelar la cita");
        return;
      }

      setStatus("CANCELLED");
      onCancel?.(appointment.id);

      toast.success(`Cita de ${appointment.customerName} cancelada`, {
        style: {
          borderRadius: "12px",
          background: "#FFF",
          color: "#1e293b",
          border: "1px solid #bbf7d0",
          fontSize: "13px",
        },
      });
    } catch {
      toast.error(t("errors.network"));
    } finally {
      setLoadingCancel(false);
    }
  };

  const confirmCancel = () => {
    toast(
      (toastInstance) => (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col gap-3 p-1 min-w-55"
        >
          <div className="flex items-start gap-2">
            <div className="p-1.5 bg-red-50 rounded-lg shrink-0">
              <AlertTriangle size={14} className="text-red-500" />
            </div>

            <div>
              <p className="text-sm font-black text-gray-900 leading-tight">
                Cancelar cita
              </p>

              <p className="text-[11px] text-gray-500 mt-0.5 font-medium">
                ¿Seguro que quieres cancelar la cita de {appointment.customerName} para {appointment.service}?
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                toast.dismiss(toastInstance.id);
                executeCancel();
              }}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-xl text-xs font-bold transition-colors active:scale-95"
            >
              Cancelar cita
            </button>

            <button
              onClick={() => toast.dismiss(toastInstance.id)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-2 rounded-xl text-xs font-bold transition-colors active:scale-95"
            >
              Mantener
            </button>
          </div>
        </motion.div>
      ),
      {
        duration: 6000,
        position: "bottom-center",
        style: {
          borderRadius: "16px",
          padding: "12px",
          background: "#fff",
          boxShadow: "0 20px 40px -8px rgba(0,0,0,0.15)",
          border: "1px solid #f1f5f9",
        },
      }
    );
  };

  const statusStyles: Record<AppointmentStatus, string> = {
    CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-100",
    COMPLETED: "bg-gray-50 text-gray-500 border-gray-100",
    PENDING: "bg-amber-50 text-amber-700 border-amber-100",
    CANCELLED: "bg-red-50 text-red-700 border-red-100",
  };

  const canCancel = status === "PENDING" || status === "CONFIRMED";

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
                className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center transition-colors ${status === "PENDING"
                  ? "bg-amber-50 text-amber-500"
                  : status === "CANCELLED"
                    ? "bg-red-50 text-red-500"
                    : "bg-indigo-50 text-indigo-500"
                  }`}
              >
                {status === "COMPLETED" ? (
                  <CheckCircle2 size={20} />
                ) : status === "CANCELLED" ? (
                  <XCircle size={20} />
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
                    {t("customerDetails")}
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between group/item">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <Phone size={14} />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs text-gray-400 font-medium leading-none">
                            {t("fields.phone")}
                          </p>
                          <p className="text-sm font-bold text-gray-700 truncate">
                            {appointment.customerPhone || t("fields.noPhone")}
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
                          {t("fields.email")}
                        </p>
                        <p className="text-sm font-bold text-gray-700 truncate">
                          {appointment.customerEmail || t("fields.noEmail")}
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

            <div className="flex flex-wrap gap-2 items-center justify-end">
              <span
                className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border shrink-0 ${statusStyles[status]}`}
              >
                {status === "CANCELLED" ? "CANCELADA" : t(`status.${status}`)}
              </span>

              {status === "PENDING" && (
                <button
                  onClick={handleConfirm}
                  disabled={loadingConfirm || loadingCancel}
                  className="text-[11px] md:text-xs px-3 md:px-4 py-1.5 rounded-full bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
                >
                  {loadingConfirm ? "..." : t("confirm")}
                </button>
              )}

              {canCancel && (
                <button
                  onClick={confirmCancel}
                  disabled={loadingCancel || loadingConfirm}
                  className="text-[11px] md:text-xs px-3 md:px-4 py-1.5 rounded-full bg-red-50 text-red-600 border border-red-100 font-bold hover:bg-red-600 hover:text-white transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
                >
                  {loadingCancel ? "..." : "Cancelar"}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </Popover>
  );
}
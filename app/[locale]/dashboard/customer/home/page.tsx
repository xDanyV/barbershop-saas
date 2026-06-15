"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Clock, User, Calendar as CalendarIcon, History, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

type Appointment = {
  id: string;
  date: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  service: { name: string; duration: number; price: number };
  barber: { user: { name: string | null } };
};

export default function CustomerHome() {
  const t = useTranslations("CustomerHome");
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [history, setHistory] = useState<Appointment[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/protected/appointments/user")
      .then((res) => res.json())
      .then((data: Appointment[]) => {
        const nowMs = Date.now();
        const ONE_HOUR_MS = 60 * 60 * 1000;
        setAppointments(data.filter((a) => {
          const apptMs = new Date(a.date).getTime();
          return a.status !== "CANCELLED" && (apptMs + ONE_HOUR_MS) > nowMs;
        }));
        setHistory(data.filter((a) => {
          const apptMs = new Date(a.date).getTime();
          return a.status === "CANCELLED" || (apptMs + ONE_HOUR_MS) <= nowMs;
        }));
      })
      .catch(() => console.error("Could not load appointments"))
      .finally(() => setLoading(false));
  }, []);

  const handleNewBooking = () => {
    const active = appointments.filter((a) => a.status === "PENDING" || a.status === "CONFIRMED");
    if (active.length >= 2) {
      toast.error(t("errors.maxAppointments"), {
        id: "limit",
        icon: "🚫",
        style: {
          borderRadius: "8px", background: "#FFFFFF", color: "#1e293b",
          border: "1px solid #e2e8f0", fontSize: "14px",
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
        },
      });
      return;
    }
    router.push("/dashboard/customer/barbers");
  };

  const confirmCancel = (appointmentId: string, appointmentDate: string, serviceName: string) => {
    const hoursUntil = (new Date(appointmentDate).getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntil < 2) {
      toast.error(t("errors.tooLate"), {
        style: {
          borderRadius: "12px", background: "#FFF", color: "#1e293b",
          border: "1px solid #fecaca", fontSize: "13px",
        },
      });
      return;
    }

    // Confirmation toast with two action buttons
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
                {t("cancelConfirm.title")}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5 font-medium">
                {t("cancelConfirm.description", { service: serviceName })}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                toast.dismiss(toastInstance.id);
                executeCancel(appointmentId);
              }}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-xl text-xs font-bold transition-colors active:scale-95"
            >
              {t("cancelConfirm.confirm")}
            </button>
            <button
              onClick={() => toast.dismiss(toastInstance.id)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-2 rounded-xl text-xs font-bold transition-colors active:scale-95"
            >
              {t("cancelConfirm.keep")}
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

  const executeCancel = async (appointmentId: string) => {
    setCancelling(appointmentId);

    try {
      const res = await fetch(`/api/protected/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? t("errors.cancelFailed"));
        return;
      }

      setAppointments((prev) => prev.filter((a) => a.id !== appointmentId));

      toast.success(t("success.cancelled"), {
        style: {
          borderRadius: "12px",
          background: "#f0fdf4",
          color: "#166534",
          border: "1px solid #bbf7d0",
          fontSize: "13px",
        },
      });
    } catch {
      toast.error(t("errors.network"));
    } finally {
      setCancelling(null);
    }
  };

  const list = showHistory ? history : appointments;

  return (
    <div className="pb-24 md:pb-0 md:p-8 max-w-2xl mx-auto">

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between mb-8 md:mb-10 gap-4 text-center md:text-left"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">{t("title")}</h1>
          <p className="text-gray-400 text-sm mt-1 font-medium">
            {showHistory ? t("subtitleHistory") : t("subtitleUpcoming")}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleNewBooking}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-500 transition-all text-sm"
        >
          <Plus size={16} />
          {t("bookNow")}
        </motion.button>
      </motion.header>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-6 flex justify-center md:justify-start"
      >
        <div className="inline-flex bg-gray-100/80 backdrop-blur-sm rounded-2xl p-1.5 border border-gray-200/50">
          <button
            onClick={() => setShowHistory(false)}
            className={`flex items-center gap-2 px-5 py-2 text-xs md:text-sm font-bold rounded-xl transition-all ${!showHistory ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
          >
            <CalendarIcon size={14} />
            {t("tabs.upcoming")}
            {appointments.length > 0 && !showHistory && (
              <span className="bg-indigo-100 text-indigo-600 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {appointments.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className={`flex items-center gap-2 px-5 py-2 text-xs md:text-sm font-bold rounded-xl transition-all ${showHistory ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
          >
            <History size={14} />
            {t("tabs.history")}
          </button>
        </div>
      </motion.div>

      {/* List */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`bg-gray-50 border border-gray-100 animate-pulse ${showHistory ? "h-16 rounded-2xl" : "h-32 rounded-3xl"}`} />
            ))}
          </motion.div>

        ) : list.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-[2.5rem] px-6"
          >
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="text-gray-300" size={24} />
            </div>
            <p className="text-gray-500 font-bold text-sm">{t("empty")}</p>
          </motion.div>

        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={showHistory
              ? "bg-white border border-gray-100 rounded-[2.5rem] shadow-xl shadow-gray-100/50 p-4 md:p-6"
              : "space-y-3"
            }
          >
            <div className={showHistory ? "overflow-y-auto pr-1 custom-scrollbar max-h-120 grid gap-1" : "space-y-3"}>
              <AnimatePresence mode="popLayout">
                {list.map((a, idx) => {
                  const date = new Date(a.date);
                  const formattedTime = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

                  /* ── History row ── */
                  if (showHistory) {
                    return (
                      <motion.div
                        key={a.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.03 }}
                        className="flex items-center justify-between py-3 group hover:bg-gray-50/80 px-3 rounded-2xl transition-all border border-transparent hover:border-gray-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-center min-w-11 bg-gray-50 py-2 px-2 rounded-xl group-hover:bg-white transition-colors border border-gray-100/50">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">
                              {date.toLocaleDateString("en-US", { month: "short" })}
                            </p>
                            <p className="text-sm font-black text-gray-800 leading-none">{date.getDate()}</p>
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-sm tracking-tight">{a.service.name}</h3>
                            <p className="text-[11px] text-gray-400 font-medium flex items-center gap-1.5 mt-0.5">
                              <span className="text-gray-700 font-semibold">{a.barber.user.name}</span>
                              <span className="text-gray-300">·</span>
                              <span>{formattedTime}</span>
                            </p>
                          </div>
                        </div>
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold tracking-wide border ${a.status === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : "bg-rose-50 text-rose-600 border-rose-100"
                          }`}>
                          {t(`status.${a.status}`)}
                        </span>
                      </motion.div>
                    );
                  }

                  /* ── Upcoming card ── */
                  return (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: idx * 0.06, ease: "easeOut" }}
                      className="group bg-white border border-gray-100 rounded-3xl p-4 md:p-5 shadow-sm hover:shadow-lg hover:shadow-gray-100/60 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row items-center gap-4">

                        {/* Date badge */}
                        <div className="bg-indigo-50/60 border border-indigo-100/80 rounded-2xl px-5 py-3 text-center min-w-20 group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-colors w-full sm:w-auto">
                          <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest group-hover:text-indigo-200">
                            {date.toLocaleDateString("en-US", { month: "short" })}
                          </p>
                          <p className="text-2xl md:text-3xl font-black text-indigo-600 leading-none group-hover:text-white">
                            {date.getDate()}
                          </p>
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center sm:text-left space-y-2 w-full">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                            <h3 className="font-black text-gray-900 text-base md:text-lg tracking-tight">
                              {a.service.name}
                            </h3>
                            <span className={`w-fit mx-auto sm:mx-0 text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest border ${a.status === "CONFIRMED"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                              : "bg-amber-50 text-amber-600 border-amber-100"
                              }`}>
                              {t(`status.${a.status}`)}
                            </span>
                          </div>
                          <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-1.5 text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-tight">
                            <div className="flex items-center gap-1.5">
                              <Clock size={12} className="text-indigo-400" />
                              {formattedTime} · {a.service.duration}m
                            </div>
                            <div className="flex items-center gap-1 text-emerald-600 font-black tracking-normal">
                              $ {a.service.price.toFixed(2)}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <User size={12} className="text-indigo-400" />
                              {a.barber.user.name}
                            </div>
                          </div>
                        </div>

                        {/* Cancel button */}
                        <div className="shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-50">
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => confirmCancel(a.id, a.date, a.service.name)}
                            disabled={cancelling === a.id}
                            className="w-full sm:w-auto px-4 py-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold text-xs disabled:opacity-40 border border-transparent hover:border-red-100"
                          >
                            {cancelling === a.id ? (
                              <span className="flex items-center gap-1.5 justify-center">
                                <span className="w-3 h-3 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
                                {t("cancel")}
                              </span>
                            ) : (
                              t("cancel")
                            )}
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
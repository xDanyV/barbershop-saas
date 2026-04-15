"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Clock, User, Scissors, Calendar as CalendarIcon, History, ChevronRight } from "lucide-react";

type Appointment = {
  id: string;
  date: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  service: {
    name: string;
    duration: number;
    price: number;
  };
  barber: {
    user: {
      name: string | null;
    };
  };
};

export default function CustomerHome() {
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

        const upcoming = data.filter((a) => {
          const apptMs = new Date(a.date).getTime();
          return a.status !== "CANCELLED" && (apptMs + ONE_HOUR_MS) > nowMs;
        });

        const history = data.filter((a) => {
          const apptMs = new Date(a.date).getTime();
          return a.status === "CANCELLED" || (apptMs + ONE_HOUR_MS) <= nowMs;
        });

        setAppointments(upcoming);
        setHistory(history);
      })
      .catch(() => console.error("Could not load appointments"))
      .finally(() => setLoading(false));
  }, []);

  const handleNewBooking = () => {
    const activeAppointments = appointments.filter(
      (a) => a.status === "PENDING" || a.status === "CONFIRMED"
    );

    if (activeAppointments.length >= 2) {
      toast.error("You can only have a maximum of 2 active appointments.", {
        id: "limit",
        icon: '🚫',
        style: {
          borderRadius: '8px',
          background: '#FFFFFF',
          color: '#1e293b',
          border: '1px solid #e2e8f0',
          fontSize: '14px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        },
      });
      return;
    }

    router.push("/dashboard/customer/barbers");
  };

  const handleCancel = async (appointmentId: string, appointmentDate: string) => {
    const hoursUntil = (new Date(appointmentDate).getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntil < 2) {
      toast.error("Appointments cannot be cancelled less than 2 hours before the scheduled time");
      return;
    }

    setCancelling(appointmentId);
    try {
      const res = await fetch(`/api/protected/appointments/${appointmentId}/confirm`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not cancel appointment");
        return;
      }

      setAppointments((prev) => prev.filter((a) => a.id !== appointmentId));
      toast.success("Appointment cancelled successfully");
    } catch {
      toast.error("Network error, please try again");
    } finally {
      setCancelling(null);
    }
  };

  const list = showHistory ? history : appointments;

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto min-h-screen">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 md:mb-10 gap-6 text-center md:text-left">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
            My Appointments
          </h1>
          <p className="text-gray-500 text-sm md:font-medium mt-1">
            {showHistory ? "Review your past grooming sessions" : "Your next style is waiting"}
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleNewBooking}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all text-sm md:text-base"
        >
          <Plus size={18} />
          Book Now
        </motion.button>
      </header>

      {/* Tabs */}
      <div className="mb-8 flex justify-center md:justify-start">
        <div className="inline-flex bg-gray-100/80 backdrop-blur-sm rounded-2xl p-1.5 border border-gray-200/50">
          <button
            onClick={() => setShowHistory(false)}
            className={`flex items-center gap-2 px-6 py-2 text-xs md:text-sm font-bold rounded-xl transition-all ${!showHistory ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <CalendarIcon size={16} />
            Upcoming
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className={`flex items-center gap-2 px-6 py-2 text-xs md:text-sm font-bold rounded-xl transition-all ${showHistory ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <History size={16} />
            History
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`bg-gray-50 border border-gray-100 animate-pulse ${showHistory ? "h-16 rounded-2xl" : "h-32 rounded-4xl"}`} />
            ))}
          </motion.div>
        ) : list.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16 bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-[2.5rem] px-6">
            <CalendarIcon className="text-gray-300 mx-auto mb-4" size={32} />
            <p className="text-gray-500 font-bold">No appointments found</p>
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={showHistory ? "divide-y divide-gray-100" : "space-y-4"}>
            {list.map((a, idx) => {
              const date = new Date(a.date);
              const formattedTime = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

              {/* VISTA DE HISTORIAL (COMPACTA) */ }
              if (showHistory) {
                return (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between py-4 group hover:bg-gray-50/50 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-11.25">
                        <p className="text-[10px] font-black text-gray-400 uppercase">{date.toLocaleDateString("en-US", { month: "short" })}</p>
                        <p className="text-lg font-black text-gray-700 leading-none">{date.getDate()}</p>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{a.service.name}</h3>
                        <p className="text-[11px] text-gray-500 font-medium">
                          {a.barber.user.name} • {formattedTime}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase border ${a.status === "COMPLETED" ? "bg-gray-50 text-gray-400 border-gray-100" : "bg-red-50 text-red-600 border-red-100"
                      }`}>
                      {a.status}
                    </span>
                  </motion.div>
                );
              }

              {/* VISTA UPCOMING (CARD ORIGINAL OPTIMIZADA) */ }
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group bg-white border border-gray-100 rounded-4xl md:rounded-4xl p-4 md:p-5 shadow-sm hover:shadow-xl hover:shadow-gray-100/50 transition-all flex flex-col sm:flex-row items-center gap-4 md:gap-6"
                >
                  {/* Date Badge */}
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl md:rounded-3xl px-4 py-3 md:px-5 md:py-4 text-center min-w-17.5 md:min-w-20 group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-colors w-full sm:w-auto">
                    <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest group-hover:text-indigo-200">
                      {date.toLocaleDateString("en-US", { month: "short" })}
                    </p>
                    <p className="text-2xl md:text-3xl font-black text-indigo-600 leading-none group-hover:text-white">
                      {date.getDate()}
                    </p>
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-center sm:text-left space-y-2 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <h3 className="font-black text-gray-900 text-base md:text-lg tracking-tight">{a.service.name}</h3>
                      <span className="w-fit mx-auto sm:mx-0 text-[9px] md:text-[10px] px-3 py-0.5 rounded-full font-black uppercase tracking-widest border bg-emerald-50 text-emerald-600 border-emerald-100">
                        {a.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-y-2 gap-x-4 text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-tight">
                      <div className="flex items-center gap-1.5"><Clock size={14} className="text-indigo-400" /> {formattedTime} · {a.service.duration}m</div>
                      <div className="flex items-center gap-1.5 text-indigo-500 font-black tracking-normal">$ {a.service.price.toFixed(2)}</div>
                      <div className="flex items-center gap-1.5"><User size={14} className="text-indigo-400" /> {a.barber.user.name}</div>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="shrink-0 flex items-center w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-50 mt-2 sm:mt-0">
                    <button
                      onClick={() => handleCancel(a.id, a.date)}
                      className="w-full sm:w-auto p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
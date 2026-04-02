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
        const now = new Date();
        const upcoming = data.filter((a) => new Date(a.date) >= now);
        const history = data.filter((a) => new Date(a.date) < now);
        setAppointments(upcoming);
        setHistory(history);
      })
      .catch(() => console.error("Could not load appointments"))
      .finally(() => setLoading(false));
  }, []);

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
    <div className="p-8 max-w-2xl mx-auto min-h-screen">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            My Appointments
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            {showHistory ? "Review your past grooming sessions" : "Your next style is waiting"}
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push("/dashboard/customer/barbers")}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
        >
          <Plus size={18} />
          Book Now
        </motion.button>
      </header>

      {/* Tabs Custom Design */}
      <div className="mb-8">
        <div className="inline-flex bg-gray-100/80 backdrop-blur-sm rounded-2xl p-1.5 border border-gray-200/50">
          <button
            onClick={() => setShowHistory(false)}
            className={`flex items-center gap-2 px-6 py-2 text-sm font-bold rounded-xl transition-all ${!showHistory ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
          >
            <CalendarIcon size={16} />
            Upcoming
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className={`flex items-center gap-2 px-6 py-2 text-sm font-bold rounded-xl transition-all ${showHistory ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
          >
            <History size={16} />
            History
          </button>
        </div>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-50 border border-gray-100 rounded-4xl animate-pulse" />
            ))}
          </motion.div>
        ) : list.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-[3rem]"
          >
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <CalendarIcon className="text-gray-300" size={32} />
            </div>
            <p className="text-gray-500 font-bold text-lg">No appointments yet</p>
            <p className="text-gray-400 text-sm mb-6 px-10">Time for a fresh cut? Book your favorite barber today.</p>
            {!showHistory && (
              <button
                onClick={() => router.push("/dashboard/customer/barbers")}
                className="text-indigo-600 font-bold hover:underline"
              >
                Start booking now →
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {list.map((a, idx) => {
              const date = new Date(a.date);
              const formattedTime = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
              const hoursUntil = (date.getTime() - Date.now()) / (1000 * 60 * 60);
              const canCancel = hoursUntil >= 2;
              const isCancelling = cancelling === a.id;

              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group bg-white border border-gray-100 rounded-4xl p-5 shadow-sm hover:shadow-xl hover:shadow-gray-100/50 transition-all flex flex-col sm:flex-row items-center gap-6"
                >
                  {/* Date Badge */}
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl px-5 py-4 text-center min-w-20 group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-colors">
                    <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest group-hover:text-indigo-200">
                      {date.toLocaleDateString("en-US", { month: "short" })}
                    </p>
                    <p className="text-3xl font-black text-indigo-600 leading-none group-hover:text-white">
                      {date.getDate()}
                    </p>
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <h3 className="font-black text-gray-900 text-lg tracking-tight">{a.service.name}</h3>
                      <span className={`w-fit mx-auto sm:mx-0 text-[10px] px-3 py-0.5 rounded-full font-black uppercase tracking-widest border ${a.status === "CONFIRMED" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                        a.status === "COMPLETED" ? "bg-gray-50 text-gray-400 border-gray-100" :
                          a.status === "CANCELLED" ? "bg-red-50 text-red-600 border-red-100" :
                            "bg-amber-50 text-amber-600 border-amber-100"
                        }`}>
                        {a.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap justify-center sm:justify-start gap-y-1 gap-x-4 text-xs font-bold text-gray-400 uppercase tracking-tighter">
                      <div className="flex items-center gap-1.5"><Clock size={14} className="text-indigo-400" /> {formattedTime} · {a.service.duration}m</div>
                      <div className="flex items-center gap-1.5 text-indigo-500 font-black tracking-normal">$ {a.service.price.toFixed(2)}</div>
                      <div className="flex items-center gap-1.5"><User size={14} className="text-indigo-400" /> {a.barber.user.name ?? "Barber"}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  {!showHistory && (
                    <div className="shrink-0 flex items-center">
                      <button
                        onClick={() => handleCancel(a.id, a.date)}
                        disabled={!canCancel || isCancelling}
                        className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all disabled:opacity-30 flex items-center gap-2 font-bold text-xs"
                        title={!canCancel ? "Cannot cancel within 2 hours of appointment" : ""}
                      >
                        {isCancelling ? "..." : "Cancel"}
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
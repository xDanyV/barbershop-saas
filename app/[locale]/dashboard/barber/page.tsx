"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import DashboardHeader from "./components/DashboardHeader";
import CalendarPicker from "./components/CalendarPicker";
import AppointmentList from "./components/AppointmentList";
import { motion } from "framer-motion";

type RawAppointment = {
  id: string;
  date: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  user: { name: string; email?: string; phone?: string };
  service: { name: string };
};

type Appointment = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  service: string;
  time: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED";
};

type Exception = {
  startDate: string;
  endDate: string;
};

export default function BarberDashboard() {
  const [date, setDate] = useState("");
  const [raw, setRaw] = useState<RawAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [barberId, setBarberId] = useState<string | null>(null);
  const [workingDays, setWorkingDays] = useState<number[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [syncing, setSyncing] = useState(false);
  const POLL_INTERVAL_MS = 30_000; // 30 seconds

  useEffect(() => {
    fetch("/api/protected/barbers/me")
      .then((res) => res.json())
      .then((data) => setBarberId(data.barberId))
      .catch(() => console.error("Could not load barber profile"));
  }, []);

  // Extracted fetch so it can be called both on mount and on the polling interval.
  // availability and exceptions only fetched on mount — they rarely change mid-session.
  const fetchAppointments = useCallback(async (isInitial = false) => {
    if (!barberId) return;
    if (isInitial) setLoading(true);
    else setSyncing(true);

    try {
      const res = await fetch("/api/protected/appointments/barber");
      const data = await res.json();
      setRaw(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Could not load appointments", err);
      if (isInitial) setRaw([]);
    } finally {
      if (isInitial) setLoading(false);
      else setSyncing(false);
    }
  }, [barberId]);

  useEffect(() => {
    if (!barberId) {
      setLoading(false);
      return;
    }

    // Initial load — fetch everything
    fetchAppointments(true);

    fetch(`/api/exceptions/${barberId}`)
      .then((res) => res.json())
      .then((data) => setExceptions(Array.isArray(data) ? data : []))
      .catch(() => console.error("Could not load exceptions"));

    fetch("/api/protected/availability")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setWorkingDays(data.map((d: any) => d.dayOfWeek));
        }
      })
      .catch(() => console.error("Could not load availability"));

    // Polling — refetch appointments every 30s silently
    const interval = setInterval(() => fetchAppointments(false), POLL_INTERVAL_MS);
    return () => clearInterval(interval);

  }, [barberId, fetchAppointments]);

  const handleConfirm = (id: string) => {
    setRaw((prev) =>
      Array.isArray(prev)
        ? prev.map((a) => a.id === id ? { ...a, status: "CONFIRMED" as const } : a)
        : []
    );
  };

  const filterDate = date || new Date().toISOString().split("T")[0];

  // Extract the LOCAL date string from a UTC ISO string.
  // Dates are stored as true UTC (browser local time → toISOString() → real UTC).
  // We must use local Date methods to display the correct day and time for the user.
  const getLocalDateString = (iso: string) => {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const getLocalTimeString = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const appointments: Appointment[] = (Array.isArray(raw) ? raw : [])
    .filter((a) => a.date && getLocalDateString(a.date) === filterDate)
    .map((a) => {
      const isPast = new Date(a.date) < new Date();

      const status: "PENDING" | "CONFIRMED" | "COMPLETED" =
        a.status === "CANCELLED" ? "PENDING" :
          a.status === "CONFIRMED" && isPast ? "COMPLETED" :
            a.status as any;

      return {
        id: a.id,
        customerName: a.user?.name ?? "Unknown",
        customerEmail: a.user?.email ?? "N/A",
        customerPhone: a.user?.phone ?? "N/A",
        service: a.service?.name ?? "Service",
        time: a.date ? getLocalTimeString(a.date) : "--:--",
        status,
      };
    });

  const appointmentCounts = (Array.isArray(raw) ? raw : []).reduce<Record<string, number>>((acc, a) => {
    if (a.date) {
      const key = getLocalDateString(a.date);
      acc[key] = (acc[key] || 0) + 1;
    }
    return acc;
  }, {});

  const refreshExceptions = () => {
    if (!barberId) return;
    fetch(`/api/exceptions/${barberId}`)
      .then((res) => res.json())
      .then((data) => setExceptions(Array.isArray(data) ? data : []))
      .catch(() => console.error("Could not refresh exceptions"));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full pb-24 md:pb-0"
    >
      <DashboardHeader onExceptionAdded={refreshExceptions} />

      {/* Sync indicator */}
      <div className="flex items-center justify-end gap-2 mb-2 h-5">
        {syncing ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 uppercase tracking-widest"
          >
            <span className="w-2.5 h-2.5 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
            Syncing...
          </motion.div>
        ) : lastUpdated ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] font-medium text-gray-300 tabular-nums"
          >
            Updated {lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </motion.p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start mt-2">
        <div className="lg:col-span-5 w-full flex justify-center lg:justify-start overflow-hidden">
          <CalendarPicker
            selectedDate={date}
            onChange={setDate}
            appointmentCounts={appointmentCounts}
            exceptions={exceptions}
            workingDays={workingDays}
          />
        </div>

        <div className="lg:col-span-7 w-full">
          <AppointmentList
            appointments={loading ? [] : appointments}
            onConfirm={handleConfirm}
            selectedDate={filterDate}
            exceptions={exceptions}
          />
        </div>
      </div>
    </motion.div>
  );
}
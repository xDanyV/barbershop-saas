"use client";

import { useState, useEffect } from "react";
import DashboardHeader from "./components/DashboardHeader";
import CalendarPicker from "./components/CalendarPicker";
import AppointmentList from "./components/AppointmentList";
import { motion } from "framer-motion";

type RawAppointment = {
  id: string;
  date: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  user: { name: string };
  service: { name: string };
};

type Appointment = {
  id: string;
  customerName: string;
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

  useEffect(() => {
    fetch("/api/protected/barbers/me")
      .then((res) => res.json())
      .then((data) => setBarberId(data.barberId))
      .catch(() => console.error("Could not load barber profile"));
  }, []);

  useEffect(() => {
    if (!barberId) return;

    fetch("/api/protected/appointments/barber")
      .then((res) => res.json())
      .then((data: RawAppointment[]) => setRaw(data))
      .catch((err) => console.error("Could not load appointments", err))
      .finally(() => setLoading(false));

    fetch(`/api/exceptions/${barberId}`)
      .then((res) => res.json())
      .then((data: Exception[]) => setExceptions(data))
      .catch(() => console.error("Could not load exceptions"));
  }, [barberId]);

  const handleConfirm = (id: string) => {
    setRaw((prev) =>
      prev.map((a) => a.id === id ? { ...a, status: "CONFIRMED" as const } : a)
    );
  };

  const filterDate = date || new Date().toISOString().split("T")[0];

  const appointments: Appointment[] = raw
    .filter((a) => a.date.split("T")[0] === filterDate)
    .map((a) => {

      const isPast = new Date(a.date) < new Date();

      let status: "PENDING" | "CONFIRMED" | "COMPLETED" =
        a.status === "CANCELLED" ? "PENDING" :
          a.status === "CONFIRMED" && isPast ? "COMPLETED" :
            a.status;

      return {
        id: a.id,
        customerName: a.user.name ?? "Unknown",
        service: a.service.name,
        time: new Date(a.date).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status,
      };
    });
  const appointmentCounts = raw.reduce<Record<string, number>>((acc, a) => {
    const key = a.date.split("T")[0];
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const refreshExceptions = () => {
    if (!barberId) return;
    fetch(`/api/exceptions/${barberId}`)
      .then((res) => res.json())
      .then((data: Exception[]) => setExceptions(data))
      .catch(() => console.error("Could not refresh exceptions"));
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 max-w-6xl mx-auto min-h-screen"
    >
      <DashboardHeader onExceptionAdded={refreshExceptions} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-4">
        <div className="lg:col-span-5 flex justify-center lg:justify-start">
          <CalendarPicker
            selectedDate={date}
            onChange={setDate}
            appointmentCounts={appointmentCounts}
            exceptions={exceptions}
          />
        </div>

        <div className="lg:col-span-7">
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
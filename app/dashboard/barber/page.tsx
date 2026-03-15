"use client";

import { useState, useEffect } from "react";
import DashboardHeader from "./components/DashboardHeader";
import CalendarPicker from "./components/CalendarPicker";
import AppointmentList from "./components/AppointmentList";

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
  status: "PENDING" | "CONFIRMED";
};

export default function BarberDashboard() {
  const [date, setDate] = useState("");
  const [raw, setRaw] = useState<RawAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/protected/appointments/barber")
      .then((res) => res.json())
      .then((data) => {
        setRaw(data);
      })
      .catch((err) => console.error("fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  const filterDate = date || new Date().toISOString().split("T")[0];

  const appointments: Appointment[] = raw
    .filter((a) => a.date.split("T")[0] === filterDate)
    .map((a) => ({
      id: a.id,
      customerName: a.user.name ?? "Unknown",
      service: a.service.name,
      time: new Date(a.date).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: a.status === "CANCELLED" ? "PENDING" : a.status,
    }));

  // En page.tsx — construye el mapa de conteos
  const appointmentCounts = raw.reduce<Record<string, number>>((acc, a) => {
    const key = a.date.split("T")[0];
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  // Pásalo al calendario
  <CalendarPicker
    selectedDate={date}
    onChange={setDate}
    appointmentCounts={appointmentCounts}
  />

  return (
    <div className="p-8 max-w-4xl mx-auto">

      <DashboardHeader />

      <div className="grid grid-cols-2 gap-8 items-start">

        <CalendarPicker
          selectedDate={date}
          onChange={setDate}
          appointmentCounts={appointmentCounts}
        />

        <AppointmentList
          appointments={loading ? [] : appointments}
        />

      </div>

    </div>
  );
}
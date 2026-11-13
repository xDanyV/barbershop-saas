"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import DashboardHeader from "./components/DashboardHeader";
import CalendarPicker from "./components/CalendarPicker";
import AppointmentList from "./components/AppointmentList";
import WalkInDialog from "./components/WalkInDialog";


type RawAppointment = {
  id: string;
  date: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
  user: { name: string; email?: string; phone?: string } | null;
  walkInName: string | null;
  walkInPhone: string | null;
  service: { name: string };
  business: { name: string; slug: string };
};

type Appointment = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  service: string;
  time: string;
  date: string;
  isWalkIn: boolean;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "NO_SHOW";
  businessName: string;
  businessSlug: string;
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
  // Nombre del barbero que el dueño está gestionando (null si es su propia agenda)
  const [managedName, setManagedName] = useState<string | null>(null);
  const [workingDays, setWorkingDays] = useState<number[]>([]);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const latestRequest = useRef(0);
  const [walkInOpen, setWalkInOpen] = useState(false);
  const POLL_INTERVAL_MS = 30_000; // 30 seconds

  useEffect(() => {
    fetch("/api/protected/barbers/me")
      .then((res) => res.json())
      .then((data) => {
        setBarberId(data.barberId);
        setManagedName(data.managing ? data.name ?? null : null);
        if (!data.barberId) setLoading(false);
      })
      .catch(() => {
        console.error("Could not load barber profile");
        setLoading(false);
      });
  }, []);

  // Solo las citas del mes que se está viendo. Una respuesta vieja nunca pisa a una más reciente.
  const fetchAppointments = useCallback(async (isInitial = false) => {
    if (!barberId) return;
    if (isInitial) setLoading(true);

    const requestId = ++latestRequest.current;
    const pad = (value: number) => String(value).padStart(2, "0");
    const { year, month } = visibleMonth;
    const from = `${year}-${pad(month + 1)}-01`;
    const to = `${year}-${pad(month + 1)}-${pad(new Date(year, month + 1, 0).getDate())}`;

    try {
      const res = await fetch(`/api/protected/appointments/barber?from=${from}&to=${to}`);
      const data = await res.json();
      if (requestId === latestRequest.current) setRaw(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Could not load appointments", err);
      if (isInitial && requestId === latestRequest.current) setRaw([]);
    } finally {
      if (isInitial && requestId === latestRequest.current) setLoading(false);
    }
  }, [barberId, visibleMonth]);

  useEffect(() => {
    // Sigue en carga hasta conocer al barbero: así no parece un día sin citas
    if (!barberId) return;

    fetchAppointments(true);

    // Solo mientras la pestaña está a la vista: en segundo plano no gasta datos ni base
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchAppointments(false);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [barberId, fetchAppointments]);

  // Horario y días libres casi no cambian: se cargan una vez
  useEffect(() => {
    if (!barberId) return;

    fetch(`/api/exceptions/${barberId}`)
      .then((res) => res.json())
      .then((data) => setExceptions(Array.isArray(data) ? data : []))
      .catch(() => console.error("Could not load exceptions"));

    fetch("/api/protected/availability")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setWorkingDays(data.map((d: { dayOfWeek: number }) => d.dayOfWeek));
        }
      })
      .catch(() => console.error("Could not load availability"));
  }, [barberId]);

  const handleConfirm = (id: string) => {
    setRaw((prev) =>
      Array.isArray(prev)
        ? prev.map((a) => a.id === id ? { ...a, status: "CONFIRMED" as const } : a)
        : []
    );
  };

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

  // El día local, no el de UTC: después de las 4 p. m. en Tijuana UTC ya va en el día siguiente
  const filterDate = date || getLocalDateString(new Date().toISOString());

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

      // Una cita confirmada que ya pasó se muestra como completada aunque el cron aún no la haya cerrado.
      // (La API no devuelve citas canceladas.)
      const status: Appointment["status"] =
        a.status === "CANCELLED" ? "PENDING" :
          a.status === "CONFIRMED" && isPast ? "COMPLETED" :
            a.status;

      return {
        id: a.id,
        customerName: a.user?.name ?? a.walkInName ?? "Unknown",
        customerEmail: a.user ? a.user.email ?? "N/A" : "",
        customerPhone: a.user ? a.user.phone ?? "N/A" : a.walkInPhone ?? "",
        service: a.service?.name ?? "Service",
        time: a.date ? getLocalTimeString(a.date) : "--:--",
        date: a.date,
        isWalkIn: !a.user,
        status,
        businessName: a.business?.name ?? "",
        businessSlug: a.business?.slug ?? "",
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
    <div className="w-full">
      <DashboardHeader onExceptionAdded={refreshExceptions} managedName={managedName} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="w-full lg:col-span-5">
          <CalendarPicker
            selectedDate={date}
            onChange={setDate}
            onMonthChange={(year, month) => setVisibleMonth({ year, month })}
            appointmentCounts={appointmentCounts}
            exceptions={exceptions}
            workingDays={workingDays}
          />
        </div>

        <div className="lg:col-span-7 w-full">
          <AppointmentList
            appointments={appointments}
            loading={loading}
            onConfirm={handleConfirm}
            onChanged={() => fetchAppointments(false)}
            onAddWalkIn={barberId ? () => setWalkInOpen(true) : undefined}
            selectedDate={filterDate}
            exceptions={exceptions}
          />
        </div>
      </div>

      {walkInOpen && barberId && (
        <WalkInDialog
          barberId={barberId}
          initialDate={filterDate}
          onClose={() => setWalkInOpen(false)}
          onCreated={() => {
            setWalkInOpen(false);
            fetchAppointments(false);
          }}
        />
      )}
    </div>
  );
}
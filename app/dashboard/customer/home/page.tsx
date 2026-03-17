"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Appointment = {
  id: string;
  date: string;
  status: "PENDING" | "CONFIRMED";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/protected/appointments/user")
      .then((res) => res.json())
      .then((data: Appointment[]) => {
        // Solo futuras
        const upcoming = data.filter((a) => new Date(a.date) >= new Date());
        setAppointments(upcoming);
      })
      .catch(() => console.error("Could not load appointments"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Appointments</h1>
          <p className="text-gray-500 mt-1">Your upcoming bookings</p>
        </div>

        <button
          onClick={() => router.push("/dashboard/customer/barbers")}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition cursor-pointer"
        >
          + Book appointment
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 animate-pulse">
              <div className="flex justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-32" />
                  <div className="h-3 bg-gray-100 rounded w-24" />
                </div>
                <div className="h-6 bg-gray-100 rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-200 rounded-2xl">
          <p className="text-gray-400 text-lg mb-4">No upcoming appointments</p>
          <button
            onClick={() => router.push("/dashboard/customer/barbers")}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition cursor-pointer"
          >
            Book your first appointment
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((a) => {
            const date = new Date(a.date);
            const formattedDate = date.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            const formattedTime = date.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={a.id}
                className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm flex items-center justify-between"
              >
                {/* Left — date block */}
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-center min-w-16 shrink-0">
                    <p className="text-xs text-indigo-400 font-medium uppercase">
                      {date.toLocaleDateString("en-US", { month: "short" })}
                    </p>
                    <p className="text-2xl font-bold text-indigo-600 leading-none">
                      {date.getDate()}
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-800">{a.service.name}</p>
                    <p className="text-sm text-gray-400">
                      {formattedTime} · {a.service.duration} min · ${a.service.price.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-400">
                      with {a.barber.user.name ?? "Barber"}
                    </p>
                  </div>
                </div>

                {/* Right — status badge */}
                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium shrink-0 ${
                    a.status === "CONFIRMED"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {a.status}
                </span>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
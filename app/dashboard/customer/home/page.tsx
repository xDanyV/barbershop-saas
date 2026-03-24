"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

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
    const hoursUntil =
      (new Date(appointmentDate).getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntil < 2) {
      toast.error(
        "Appointments cannot be cancelled less than 2 hours before the scheduled time"
      );
      return;
    }

    setCancelling(appointmentId);
    try {
      const res = await fetch(
        `/api/protected/appointments/${appointmentId}/confirm`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "CANCELLED" }),
        }
      );

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
    <div className="p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            My Appointments
          </h1>
          <p className="text-gray-500 mt-1">
            {showHistory ? "Your past bookings" : "Your upcoming bookings"}
          </p>
        </div>

        <button
          onClick={() => router.push("/dashboard/customer/barbers")}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition cursor-pointer"
        >
          + Book appointment
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="inline-flex bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setShowHistory(false)}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition ${!showHistory
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
              }`}
          >
            Upcoming
          </button>

          <button
            onClick={() => setShowHistory(true)}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition ${showHistory
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
              }`}
          >
            History
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-2xl p-5 animate-pulse"
            >
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
      ) : list.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-200 rounded-2xl">
          <p className="text-gray-400 text-lg mb-4">
            {showHistory
              ? "No past appointments"
              : "No upcoming appointments"}
          </p>

          {!showHistory && (
            <button
              onClick={() => router.push("/dashboard/customer/barbers")}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition cursor-pointer"
            >
              Book your first appointment
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((a) => {
            const date = new Date(a.date);
            const formattedTime = date.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            });

            const hoursUntil =
              (date.getTime() - Date.now()) / (1000 * 60 * 60);

            const canCancel = hoursUntil >= 2;
            const isCancelling = cancelling === a.id;

            return (
              <div
                key={a.id}
                className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm flex items-center justify-between"
              >
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
                    <p className="font-semibold text-gray-800">
                      {a.service.name}
                    </p>
                    <p className="text-sm text-gray-400">
                      {formattedTime} · {a.service.duration} min · $
                      {a.service.price.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-400">
                      with {a.barber.user.name ?? "Barber"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ${a.status === "CONFIRMED"
                        ? "bg-green-100 text-green-700"
                        : a.status === "COMPLETED"
                          ? "bg-gray-100 text-gray-600"
                          : a.status === "CANCELLED"
                            ? "bg-red-100 text-red-600"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                  >
                    {a.status}
                  </span>

                  {!showHistory && (
                    <button
                      onClick={() => handleCancel(a.id, a.date)}
                      disabled={!canCancel || isCancelling}
                      className="text-xs px-3 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isCancelling ? "Cancelling..." : "Cancel"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
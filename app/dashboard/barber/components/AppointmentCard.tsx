"use client";

import { useState } from "react";
import toast from "react-hot-toast";

type Appointment = {
  id: string;
  customerName: string;
  service: string;
  time: string;
  status: "PENDING" | "CONFIRMED";
};

export default function AppointmentCard({ appointment }: { appointment: Appointment }) {
  const [status, setStatus] = useState(appointment.status);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/protected/appointments/${appointment.id}/confirm`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONFIRMED" }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Could not confirm appointment");
        return;
      }

      setStatus("CONFIRMED");
      toast.success(`${appointment.customerName} confirmed for ${appointment.time}`);

    } catch {
      toast.error("Network error, please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 flex justify-between items-center bg-white shadow-sm">

      <div>
        <p className="font-semibold">{appointment.customerName}</p>
        <p className="text-sm text-gray-500">{appointment.service}</p>
      </div>

      <div className="text-right flex flex-col items-end gap-1.5">
        <p className="text-sm">{appointment.time}</p>

        <span
          className={`text-xs px-2 py-1 rounded ${status === "CONFIRMED"
            ? "bg-green-100 text-green-700"
            : "bg-yellow-100 text-yellow-700"
            }`}
        >
          {status}
        </span>

        {status === "PENDING" && (
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="text-xs px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Confirming..." : "Confirm"}
          </button>
        )}
      </div>

    </div>
  );
}
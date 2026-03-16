"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import CalendarPicker from "./components/CalendarPicker";
import AvailableSlots from "./components/AvailableSlots";
import BarberCard from "./components/BarberCard";

type Barber = {
  id: string;
  user: {
    name: string | null;
    email: string;
    phone: string;
  };
};

export default function CustomerDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const barberId = searchParams.get("barberId");

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [barber, setBarber] = useState<Barber | null>(null);

  useEffect(() => {
    if (!barberId) {
      router.replace("/dashboard/customer/barbers");
      return;
    }

    fetch("/api/barbers")
      .then((res) => res.json())
      .then((barbers: Barber[]) => {
        const found = barbers.find((b) => b.id === barberId);
        if (!found) {
          router.replace("/dashboard/customer/barbers");
        } else {
          setBarber(found);
        }
      })
      .catch(() => router.replace("/dashboard/customer/barbers"));
  }, [barberId]);

  if (!barberId || !barber) return null;

  return (
    <div className="p-8 grid md:grid-cols-2 gap-12">

      {/* LEFT SIDE */}
      <div className="space-y-6">

        <h2 className="text-3xl font-bold">
          {selectedDate.toDateString()}
        </h2>

        <CalendarPicker
          barberId={barberId}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />

      </div>

      {/* RIGHT SIDE */}
      <div className="space-y-4">

        <BarberCard barber={barber} />

        <AvailableSlots
          barberId={barberId}
          selectedDate={selectedDate}
          selectedService={selectedService}
        />

      </div>

    </div>
  );
}
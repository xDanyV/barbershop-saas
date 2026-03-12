"use client";

import { useState } from "react";
import CalendarPicker from "./components/CalendarPicker";
import AvailableSlots from "./components/AvailableSlots";
import ServiceSelector from "./components/ServiceSelector";

export default function CustomerDashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedService, setSelectedService] = useState<string | null>(null);

  return (
    <div className="p-8 grid md:grid-cols-2 gap-12">

      {/* LEFT SIDE */}
      <div className="space-y-6">

        <h2 className="text-3xl font-bold">
          {selectedDate.toDateString()}
        </h2>

        <CalendarPicker
          barberId="2db47b73-5cd5-4726-a6d2-c91e70684ed6" //temporary hardcoded barber ID
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />

        <ServiceSelector
          selectedService={selectedService}
          setSelectedService={setSelectedService}
        />

      </div>

      {/* RIGHT SIDE */}
      <AvailableSlots
        selectedDate={selectedDate}
        selectedService={selectedService}
      />

    </div>
  );
}
"use client";

import { useState } from "react";
import DashboardHeader from "./components/DashboardHeader";
import CalendarPicker from "./components/CalendarPicker";
import AppointmentList from "./components/AppointmentList";

export default function BarberDashboard() {

  const [date, setDate] = useState("");
  const [appointments] = useState([]);

  return (
    <div className="p-8 max-w-4xl mx-auto">

      <DashboardHeader />

      <CalendarPicker
        selectedDate={date}
        onChange={setDate}
      />

      <AppointmentList appointments={appointments} />

    </div>
  );
}
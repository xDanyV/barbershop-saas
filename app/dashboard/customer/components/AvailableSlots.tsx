"use client";

import SlotCard from "./SlotCard";

type Props = {
  selectedDate: Date;
  selectedService: string | null;
};

const mockSlots = [
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
];

export default function AvailableSlots({
  selectedDate,
  selectedService,
}: Props) {

  return (
    <div className="bg-red-100 p-6 rounded-xl shadow-md h-100 overflow-y-scroll">

      <h3 className="font-semibold mb-4">
        Available slots for {selectedDate.toDateString()}
      </h3>

      <div className="space-y-3">

        {mockSlots.map((slot) => (
          <SlotCard
            key={slot}
            time={slot}
            service={selectedService}
          />
        ))}

      </div>

    </div>
  );
}
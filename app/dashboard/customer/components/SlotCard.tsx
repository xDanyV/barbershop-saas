"use client";

type Props = {
  time: string;
  service: string | null;
};

export default function SlotCard({ time, service }: Props) {

  const handleBooking = () => {
    if (!service) {
      alert("Please select a service first");
      return;
    }

    alert(`Booking ${service} at ${time}`);
  };

  return (
    <div className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 hover:border-indigo-300 hover:bg-indigo-50 transition">

      <span className="font-medium text-gray-700">
        {time}
      </span>

      <button
        onClick={handleBooking}
        className="text-sm font-medium bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition cursor-pointer"
      >
        Book
      </button>

    </div>
  );
}
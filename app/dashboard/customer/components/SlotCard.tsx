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
    <div className="flex justify-between items-center bg-blue-500 text-white px-4 py-3 rounded-full">

      <span>{time}</span>

      <button
        onClick={handleBooking}
        className="bg-white text-black px-4 py-1 rounded-full text-sm"
      >
        Book
      </button>

    </div>
  );
}
type Appointment = {
  id: string;
  customerName: string;
  service: string;
  time: string;
  status: "PENDING" | "CONFIRMED";
};

export default function AppointmentCard({ appointment }: { appointment: Appointment }) {
  return (
    <div className="border rounded-lg p-4 flex justify-between items-center bg-white shadow-sm">
      
      <div>
        <p className="font-semibold">{appointment.customerName}</p>
        <p className="text-sm text-gray-500">
          {appointment.service}
        </p>
      </div>

      <div className="text-right">
        <p className="text-sm">{appointment.time}</p>

        <span
          className={`text-xs px-2 py-1 rounded ${
            appointment.status === "CONFIRMED"
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {appointment.status}
        </span>
      </div>
    </div>
  );
}
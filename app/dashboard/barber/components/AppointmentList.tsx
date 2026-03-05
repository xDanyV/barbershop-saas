import AppointmentCard from "./AppointmentCard";

type Appointment = {
    id: string;
    customerName: string;
    service: string;
    time: string;
    status: "PENDING" | "CONFIRMED";
};

type Props = {
    appointments: Appointment[];
};

export default function AppointmentList({ appointments }: Props) {
    if (!appointments.length) {
        return (
            <div className="bg-white rounded-xl shadow p-6 text-gray-500">
                No appointments for this day
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {appointments.map((appointment) => (
                <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                />
            ))}
        </div>
    );
}
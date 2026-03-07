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

    return (

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 w-85 min-h-90">

            <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Appointments
            </h2>

            {!appointments.length ? (

                <div className="text-lg text-gray-500">
                    No appointments for this day
                </div>

            ) : (

                <div className="space-y-3">

                    {appointments.map((appointment) => (
                        <AppointmentCard
                            key={appointment.id}
                            appointment={appointment}
                        />
                    ))}

                </div>

            )}

        </div>

    );
}
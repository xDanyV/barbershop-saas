export function validateAppointmentDate(startDate: Date) {
    const now = new Date();

    if (startDate < now) {
        return "Cannot book in the past";
    }

    if (startDate.getMinutes() !== 0) {
        return "Appointments must start on the hour";
    }

    const hour = startDate.getHours();
    const WORK_START = 6;
    const WORK_END = 21;

    if (hour < WORK_START || hour >= WORK_END) {
        return "Outside business hours";
    }

    return null;
}



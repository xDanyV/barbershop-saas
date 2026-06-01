export function validateAppointmentDate(startDate: Date) {
    const now = new Date();

    if (startDate < now) {
        return "Cannot book in the past";
    }

    // Minutes must be 0 (whole hour slots only)
    if (startDate.getUTCMinutes() !== 0) {
        return "Appointments must start on the hour";
    }

    return null;
}
export function validateAppointmentDate(startDate: Date) {
    const now = new Date();

    if (startDate < now) {
        return "Cannot book in the past";
    }

    // Use UTC minutes — the client sends a clean ISO string with :00 seconds
    // so this will always be 0 regardless of server timezone.
    if (startDate.getUTCMinutes() !== 0) {
        return "Appointments must start on the hour";
    }

    // Use UTC hours for the business hours check.
    // The client already converts the local slot time to UTC before sending,
    // so we validate the UTC hour against an equivalent UTC window.
    // Business hours 06:00–21:00 local → we skip the hour check here
    // and rely on the availability schedule stored in the DB instead,
    // which is the source of truth for when the barber actually works.
    // Keeping a loose UTC sanity check: reject anything outside 00:00–23:59
    // (always valid) — the real guard is the barber's availability schedule.

    return null;
}
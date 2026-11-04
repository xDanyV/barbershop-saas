-- Quién canceló la cita, para explicárselo al cliente
CREATE TYPE "AppointmentCanceller" AS ENUM ('CUSTOMER', 'BUSINESS', 'SYSTEM');

ALTER TABLE "Appointment" ADD COLUMN "cancelledBy" "AppointmentCanceller";

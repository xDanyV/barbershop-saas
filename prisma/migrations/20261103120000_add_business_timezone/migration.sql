-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'America/Mexico_City';

-- CreateIndex
CREATE INDEX "Appointment_barberId_date_idx" ON "Appointment"("barberId", "date");

-- CreateIndex
CREATE INDEX "BarberException_barberId_idx" ON "BarberException"("barberId");

-- Data: las excepciones existentes se guardaron como días completos en UTC.
-- Se convierten a días completos en la zona horaria del negocio.
UPDATE "BarberException" AS e
SET
    "startDate" = (e."startDate"::date::timestamp AT TIME ZONE b."timezone") AT TIME ZONE 'UTC',
    "endDate"   = (((e."endDate"::date + 1)::timestamp AT TIME ZONE b."timezone") AT TIME ZONE 'UTC') - INTERVAL '1 millisecond'
FROM "Barber" AS br
JOIN "Business" AS b ON b."id" = br."businessId"
WHERE br."id" = e."barberId";

-- AlterTable: el producto es para barberías de Tijuana / Baja California
ALTER TABLE "Business" ALTER COLUMN "timezone" SET DEFAULT 'America/Tijuana';

-- Data: las excepciones de negocios en America/Mexico_City se guardaron como días completos en esa zona.
-- Se recalculan como los mismos días completos en America/Tijuana.
UPDATE "BarberException" AS e
SET
    "startDate" = (((e."startDate" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Mexico_City')::date::timestamp AT TIME ZONE 'America/Tijuana') AT TIME ZONE 'UTC',
    "endDate"   = ((((e."endDate" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Mexico_City')::date + 1)::timestamp AT TIME ZONE 'America/Tijuana') AT TIME ZONE 'UTC' - INTERVAL '1 millisecond'
FROM "Barber" AS br
JOIN "Business" AS b ON b."id" = br."businessId"
WHERE br."id" = e."barberId"
  AND b."timezone" = 'America/Mexico_City';

-- Data: los negocios existentes tenían el valor por defecto anterior
UPDATE "Business" SET "timezone" = 'America/Tijuana' WHERE "timezone" = 'America/Mexico_City';

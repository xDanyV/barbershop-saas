-- AlterTable: el precio de los servicios pasa a centavos enteros (como BusinessSubscription)
ALTER TABLE "Service" ADD COLUMN "priceCents" INTEGER;

-- Data: convertir los precios existentes
UPDATE "Service" SET "priceCents" = ROUND("price" * 100)::INTEGER;

ALTER TABLE "Service" ALTER COLUMN "priceCents" SET NOT NULL;

ALTER TABLE "Service" DROP COLUMN "price";

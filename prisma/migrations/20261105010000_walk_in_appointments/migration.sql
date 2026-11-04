-- Citas registradas por la barbería para clientes sin cuenta
ALTER TABLE "Appointment" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "Appointment" ADD COLUMN "walkInName" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "walkInPhone" TEXT;

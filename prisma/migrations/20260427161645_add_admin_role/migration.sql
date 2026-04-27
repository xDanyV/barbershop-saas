-- CreateEnum
CREATE TYPE "BarberStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'ADMIN';

-- AlterTable
ALTER TABLE "Barber" ADD COLUMN     "status" "BarberStatus" NOT NULL DEFAULT 'PENDING';

/*
  Warnings:

  - Added the required column `barberId` to the `Service` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "barberId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "Barber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

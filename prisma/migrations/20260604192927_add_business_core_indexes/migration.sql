/*
  Warnings:

  - A unique constraint covering the columns `[businessId,barberId,date]` on the table `Appointment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[barberId,dayOfWeek]` on the table `Availability` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[businessId,barberId,name]` on the table `Service` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Service_businessId_name_barberId_key";

-- CreateIndex
CREATE INDEX "Appointment_businessId_idx" ON "Appointment"("businessId");

-- CreateIndex
CREATE INDEX "Appointment_barberId_idx" ON "Appointment"("barberId");

-- CreateIndex
CREATE INDEX "Appointment_userId_idx" ON "Appointment"("userId");

-- CreateIndex
CREATE INDEX "Appointment_serviceId_idx" ON "Appointment"("serviceId");

-- CreateIndex
CREATE INDEX "Appointment_date_idx" ON "Appointment"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_businessId_barberId_date_key" ON "Appointment"("businessId", "barberId", "date");

-- CreateIndex
CREATE INDEX "Availability_barberId_idx" ON "Availability"("barberId");

-- CreateIndex
CREATE UNIQUE INDEX "Availability_barberId_dayOfWeek_key" ON "Availability"("barberId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "Barber_businessId_idx" ON "Barber"("businessId");

-- CreateIndex
CREATE INDEX "Business_ownerId_idx" ON "Business"("ownerId");

-- CreateIndex
CREATE INDEX "Business_slug_idx" ON "Business"("slug");

-- CreateIndex
CREATE INDEX "BusinessGallery_businessId_idx" ON "BusinessGallery"("businessId");

-- CreateIndex
CREATE INDEX "BusinessPost_businessId_idx" ON "BusinessPost"("businessId");

-- CreateIndex
CREATE INDEX "Service_barberId_idx" ON "Service"("barberId");

-- CreateIndex
CREATE UNIQUE INDEX "Service_businessId_barberId_name_key" ON "Service"("businessId", "barberId", "name");

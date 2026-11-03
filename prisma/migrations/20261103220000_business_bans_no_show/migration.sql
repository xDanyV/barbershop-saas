-- AlterEnum
ALTER TYPE "AppointmentStatus" ADD VALUE 'NO_SHOW';

-- CreateTable
CREATE TABLE "BusinessCustomerBan" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessCustomerBan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusinessCustomerBan_userId_idx" ON "BusinessCustomerBan"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessCustomerBan_businessId_userId_key" ON "BusinessCustomerBan"("businessId", "userId");

-- AddForeignKey
ALTER TABLE "BusinessCustomerBan" ADD CONSTRAINT "BusinessCustomerBan_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessCustomerBan" ADD CONSTRAINT "BusinessCustomerBan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


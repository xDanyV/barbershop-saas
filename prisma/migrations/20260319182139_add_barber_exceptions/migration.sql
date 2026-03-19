-- CreateTable
CREATE TABLE "BarberException" (
    "id" TEXT NOT NULL,
    "barberId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BarberException_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BarberException" ADD CONSTRAINT "BarberException_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "Barber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Periodo de prueba
ALTER TYPE "BusinessBillingStatus" ADD VALUE 'TRIALING';

-- Instrucciones de pago que ven los dueños
ALTER TABLE "SystemSettings" ADD COLUMN "paymentInstructions" TEXT;

-- Historial de pagos registrados a mano
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'TRANSFER', 'CARD', 'OTHER');

CREATE TABLE "BusinessPayment" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MXN',
    "method" "PaymentMethod" NOT NULL,
    "months" INTEGER NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "previousPeriodEnd" TIMESTAMP(3),
    "previousStatus" "BusinessBillingStatus" NOT NULL,
    "recordedById" TEXT NOT NULL,
    "voidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessPayment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BusinessPayment_businessId_createdAt_idx" ON "BusinessPayment"("businessId", "createdAt");
CREATE INDEX "BusinessPayment_paidAt_idx" ON "BusinessPayment"("paidAt");

ALTER TABLE "BusinessPayment" ADD CONSTRAINT "BusinessPayment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BusinessPayment" ADD CONSTRAINT "BusinessPayment_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "BusinessBillingStatus" AS ENUM ('PENDING_PAYMENT', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELED');

-- CreateEnum
CREATE TYPE "BusinessPlanType" AS ENUM ('FOUNDER', 'BASIC');

-- CreateEnum
CREATE TYPE "SubscriptionProvider" AS ENUM ('MANUAL', 'STRIPE', 'MERCADO_PAGO');

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "billingPlan" "BusinessPlanType" NOT NULL DEFAULT 'BASIC',
ADD COLUMN     "billingStatus" "BusinessBillingStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "subscriptionEndsAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "BusinessSubscription" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "plan" "BusinessPlanType" NOT NULL DEFAULT 'BASIC',
    "billingStatus" "BusinessBillingStatus" NOT NULL DEFAULT 'ACTIVE',
    "provider" "SubscriptionProvider" NOT NULL DEFAULT 'MANUAL',
    "setupFeeCents" INTEGER NOT NULL DEFAULT 0,
    "monthlyPriceCents" INTEGER NOT NULL DEFAULT 15000,
    "currency" TEXT NOT NULL DEFAULT 'MXN',
    "providerCustomerId" TEXT,
    "providerSubscriptionId" TEXT,
    "providerPriceId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BusinessSubscription_businessId_key" ON "BusinessSubscription"("businessId");

-- CreateIndex
CREATE INDEX "BusinessSubscription_billingStatus_idx" ON "BusinessSubscription"("billingStatus");

-- CreateIndex
CREATE INDEX "BusinessSubscription_plan_idx" ON "BusinessSubscription"("plan");

-- CreateIndex
CREATE INDEX "BusinessSubscription_provider_idx" ON "BusinessSubscription"("provider");

-- CreateIndex
CREATE INDEX "Business_billingStatus_idx" ON "Business"("billingStatus");

-- CreateIndex
CREATE INDEX "Business_billingPlan_idx" ON "Business"("billingPlan");

-- AddForeignKey
ALTER TABLE "BusinessSubscription" ADD CONSTRAINT "BusinessSubscription_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data: BusinessSubscription pasa a ser la única fuente de verdad del billing.
-- 1) Crear la suscripción de los negocios que no tienen una, con los datos de Business
INSERT INTO "BusinessSubscription" (
    "id", "businessId", "plan", "billingStatus", "provider",
    "setupFeeCents", "monthlyPriceCents", "currency",
    "currentPeriodStart", "currentPeriodEnd", "createdAt", "updatedAt"
)
SELECT
    gen_random_uuid()::text,
    b."id",
    b."billingPlan",
    b."billingStatus",
    'MANUAL',
    0,
    CASE WHEN b."billingPlan" = 'FOUNDER' THEN 10000 ELSE 15000 END,
    'MXN',
    b."createdAt",
    b."subscriptionEndsAt",
    NOW(),
    NOW()
FROM "Business" AS b
WHERE NOT EXISTS (
    SELECT 1 FROM "BusinessSubscription" AS s WHERE s."businessId" = b."id"
);

-- 2) Las columnas de Business eran las que leía la app: copiarlas a la suscripción
UPDATE "BusinessSubscription" AS s
SET
    "plan" = b."billingPlan",
    "billingStatus" = b."billingStatus",
    "currentPeriodEnd" = b."subscriptionEndsAt"
FROM "Business" AS b
WHERE s."businessId" = b."id";

-- DropIndex
DROP INDEX "Business_slug_idx";

-- DropIndex
DROP INDEX "Business_billingStatus_idx";

-- DropIndex
DROP INDEX "Business_billingPlan_idx";

-- AlterTable
ALTER TABLE "Business" DROP COLUMN "billingPlan",
DROP COLUMN "billingStatus",
DROP COLUMN "subscriptionEndsAt";

-- CreateTable
CREATE TABLE "FavoriteBusiness" (
    "userId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteBusiness_pkey" PRIMARY KEY ("userId","businessId")
);

-- CreateIndex
CREATE INDEX "FavoriteBusiness_businessId_idx" ON "FavoriteBusiness"("businessId");

-- AddForeignKey
ALTER TABLE "FavoriteBusiness" ADD CONSTRAINT "FavoriteBusiness_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteBusiness" ADD CONSTRAINT "FavoriteBusiness_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

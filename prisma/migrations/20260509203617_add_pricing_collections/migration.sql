-- CreateTable
CREATE TABLE "PricingCollection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceFileName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingCollectionEntry" (
    "id" TEXT NOT NULL,
    "pricingCollectionId" TEXT NOT NULL,
    "gigAmount" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingCollectionEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PricingCollection_userId_idx" ON "PricingCollection"("userId");

-- CreateIndex
CREATE INDEX "PricingCollection_userId_isActive_idx" ON "PricingCollection"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PricingCollection_userId_name_key" ON "PricingCollection"("userId", "name");

-- CreateIndex
CREATE INDEX "PricingCollectionEntry_pricingCollectionId_idx" ON "PricingCollectionEntry"("pricingCollectionId");

-- CreateIndex
CREATE INDEX "PricingCollectionEntry_gigAmount_idx" ON "PricingCollectionEntry"("gigAmount");

-- CreateIndex
CREATE UNIQUE INDEX "PricingCollectionEntry_pricingCollectionId_gigAmount_key" ON "PricingCollectionEntry"("pricingCollectionId", "gigAmount");

-- AddForeignKey
ALTER TABLE "PricingCollection" ADD CONSTRAINT "PricingCollection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingCollectionEntry" ADD CONSTRAINT "PricingCollectionEntry_pricingCollectionId_fkey" FOREIGN KEY ("pricingCollectionId") REFERENCES "PricingCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

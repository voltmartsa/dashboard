-- AlterTable
ALTER TABLE "NotificationRecipient" ADD COLUMN     "priceReport" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "PriceItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceLink" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isMine" BOOLEAN NOT NULL DEFAULT false,
    "price" DOUBLE PRECISION,
    "regularPrice" DOUBLE PRECISION,
    "title" TEXT,
    "inStock" BOOLEAN,
    "error" TEXT,
    "checkedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricePoint" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PricePoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PriceItem_ownerId_idx" ON "PriceItem"("ownerId");

-- CreateIndex
CREATE INDEX "PriceLink_itemId_idx" ON "PriceLink"("itemId");

-- CreateIndex
CREATE INDEX "PriceLink_checkedAt_idx" ON "PriceLink"("checkedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PricePoint_linkId_day_key" ON "PricePoint"("linkId", "day");

-- AddForeignKey
ALTER TABLE "PriceItem" ADD CONSTRAINT "PriceItem_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceLink" ADD CONSTRAINT "PriceLink_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "PriceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricePoint" ADD CONSTRAINT "PricePoint_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "PriceLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;


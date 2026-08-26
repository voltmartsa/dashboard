-- CreateTable
CREATE TABLE "Tender" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "province" TEXT,
    "department" TEXT,
    "tenderType" TEXT,
    "publishedDate" TIMESTAMP(3),
    "closingDate" TIMESTAMP(3),
    "briefingDate" TIMESTAMP(3),
    "briefingVenue" TEXT,
    "contactPerson" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "documents" JSONB,
    "sourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tender_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenderRule" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "provinces" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenderRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenderMatch" (
    "id" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "ownerId" TEXT,
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenderMatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tender_externalId_key" ON "Tender"("externalId");

-- CreateIndex
CREATE INDEX "Tender_closingDate_idx" ON "Tender"("closingDate");

-- CreateIndex
CREATE INDEX "Tender_category_idx" ON "Tender"("category");

-- CreateIndex
CREATE INDEX "Tender_province_idx" ON "Tender"("province");

-- CreateIndex
CREATE INDEX "TenderRule_ownerId_idx" ON "TenderRule"("ownerId");

-- CreateIndex
CREATE INDEX "TenderMatch_ownerId_idx" ON "TenderMatch"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "TenderMatch_tenderId_ruleId_key" ON "TenderMatch"("tenderId", "ruleId");

-- AddForeignKey
ALTER TABLE "TenderRule" ADD CONSTRAINT "TenderRule_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenderMatch" ADD CONSTRAINT "TenderMatch_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenderMatch" ADD CONSTRAINT "TenderMatch_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "TenderRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenderMatch" ADD CONSTRAINT "TenderMatch_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

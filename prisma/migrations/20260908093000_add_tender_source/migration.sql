-- AlterTable: add a source discriminator to Tender. Existing rows all came
-- from the national eTenders portal, so the default backfills them correctly.
ALTER TABLE "Tender" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'ETENDERS';

-- externalId is no longer globally unique — only unique within a source.
DROP INDEX "Tender_externalId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Tender_source_externalId_key" ON "Tender"("source", "externalId");

-- CreateIndex
CREATE INDEX "Tender_source_idx" ON "Tender"("source");

-- AlterTable
ALTER TABLE "StockEvent" ADD COLUMN "batchId" TEXT;

-- CreateIndex
CREATE INDEX "StockEvent_batchId_idx" ON "StockEvent"("batchId");


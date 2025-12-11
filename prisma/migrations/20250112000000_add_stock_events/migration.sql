-- CreateEnum
CREATE TYPE "StockEventType" AS ENUM ('ENTRY', 'WASTE');

-- CreateTable
CREATE TABLE "StockEvent" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "type" "StockEventType" NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'un',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StockEvent_restaurantId_createdAt_idx" ON "StockEvent"("restaurantId", "createdAt");

-- CreateIndex
CREATE INDEX "StockEvent_restaurantId_type_createdAt_idx" ON "StockEvent"("restaurantId", "type", "createdAt");

-- AddForeignKey
ALTER TABLE "StockEvent" ADD CONSTRAINT "StockEvent_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


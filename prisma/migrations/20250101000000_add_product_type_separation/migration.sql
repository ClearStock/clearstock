-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('mp', 'transformado');

-- AlterTable: Add tipo to ProductBatch
ALTER TABLE "ProductBatch" ADD COLUMN "tipo" "ProductType" NOT NULL DEFAULT 'mp';

-- AlterTable: Add tipo to Category
ALTER TABLE "Category" ADD COLUMN "tipo" "ProductType" NOT NULL DEFAULT 'mp';

-- AlterTable: Add separate alert days to Restaurant
ALTER TABLE "Restaurant" ADD COLUMN "alertDaysBeforeExpiryMP" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "Restaurant" ADD COLUMN "alertDaysBeforeExpiryTransformado" INTEGER NOT NULL DEFAULT 1;

-- Update existing restaurants to have default values
UPDATE "Restaurant" SET "alertDaysBeforeExpiryMP" = COALESCE("alertDaysBeforeExpiry", 3);
UPDATE "Restaurant" SET "alertDaysBeforeExpiryTransformado" = 1;

-- DropColumn: Remove homemade from ProductBatch (as per requirements)
ALTER TABLE "ProductBatch" DROP COLUMN IF EXISTS "homemade";


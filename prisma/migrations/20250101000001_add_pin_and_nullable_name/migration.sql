-- Step 1: Add pin column as nullable
ALTER TABLE "Restaurant" ADD COLUMN "pin" TEXT;

-- Step 2: Populate pin based on existing restaurant names
-- Map restaurant names to their corresponding PINs
UPDATE "Restaurant" SET "pin" = '1111' WHERE "name" = 'Restaurante A';
UPDATE "Restaurant" SET "pin" = '2222' WHERE "name" = 'Restaurante B';
UPDATE "Restaurant" SET "pin" = '3333' WHERE "name" = 'Restaurante C';
UPDATE "Restaurant" SET "pin" = '4921' WHERE "name" = 'Restaurante D';
UPDATE "Restaurant" SET "pin" = '5421' WHERE "name" = 'Restaurante E';
UPDATE "Restaurant" SET "pin" = '6531' WHERE "name" = 'Restaurante F';
UPDATE "Restaurant" SET "pin" = '7641' WHERE "name" = 'Restaurante G';
UPDATE "Restaurant" SET "pin" = '8751' WHERE "name" = 'Restaurante H';
UPDATE "Restaurant" SET "pin" = '9861' WHERE "name" = 'Restaurante I';
UPDATE "Restaurant" SET "pin" = '1357' WHERE "name" = 'Restaurante J';
UPDATE "Restaurant" SET "pin" = '2468' WHERE "name" = 'Restaurante K';
UPDATE "Restaurant" SET "pin" = '3579' WHERE "name" = 'Restaurante L';
UPDATE "Restaurant" SET "pin" = '4681' WHERE "name" = 'Restaurante M';
UPDATE "Restaurant" SET "pin" = '5792' WHERE "name" = 'Restaurante N';
UPDATE "Restaurant" SET "pin" = '6813' WHERE "name" = 'Restaurante O';
UPDATE "Restaurant" SET "pin" = '7924' WHERE "name" = 'Restaurante P';
UPDATE "Restaurant" SET "pin" = '8135' WHERE "name" = 'Restaurante Q';

-- Step 3: For any restaurants that don't match the above, assign a default PIN
-- This handles edge cases where restaurant names might differ
UPDATE "Restaurant" SET "pin" = '0000' WHERE "pin" IS NULL;

-- Step 4: Make pin required and unique
ALTER TABLE "Restaurant" ALTER COLUMN "pin" SET NOT NULL;
CREATE UNIQUE INDEX "Restaurant_pin_key" ON "Restaurant"("pin");

-- Step 5: Make name nullable
ALTER TABLE "Restaurant" ALTER COLUMN "name" DROP NOT NULL;


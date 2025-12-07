-- Migrate existing 4-digit PINs to 6 digits by padding with leading zeros
-- This ensures backward compatibility while moving to 6-digit format

UPDATE "Restaurant" SET "pin" = '00' || "pin" WHERE LENGTH("pin") = 4 AND "pin" ~ '^[0-9]{4}$';

-- Update specific known PINs to their 6-digit equivalents
UPDATE "Restaurant" SET "pin" = '001111' WHERE "pin" = '1111';
UPDATE "Restaurant" SET "pin" = '002222' WHERE "pin" = '2222';
UPDATE "Restaurant" SET "pin" = '003333' WHERE "pin" = '3333';
UPDATE "Restaurant" SET "pin" = '004921' WHERE "pin" = '4921';
UPDATE "Restaurant" SET "pin" = '005421' WHERE "pin" = '5421';
UPDATE "Restaurant" SET "pin" = '006531' WHERE "pin" = '6531';
UPDATE "Restaurant" SET "pin" = '007641' WHERE "pin" = '7641';
UPDATE "Restaurant" SET "pin" = '008751' WHERE "pin" = '8751';
UPDATE "Restaurant" SET "pin" = '009861' WHERE "pin" = '9861';
UPDATE "Restaurant" SET "pin" = '001357' WHERE "pin" = '1357';
UPDATE "Restaurant" SET "pin" = '002468' WHERE "pin" = '2468';
UPDATE "Restaurant" SET "pin" = '003579' WHERE "pin" = '3579';
UPDATE "Restaurant" SET "pin" = '004681' WHERE "pin" = '4681';
UPDATE "Restaurant" SET "pin" = '005792' WHERE "pin" = '5792';
UPDATE "Restaurant" SET "pin" = '006813' WHERE "pin" = '6813';
UPDATE "Restaurant" SET "pin" = '007924' WHERE "pin" = '7924';
UPDATE "Restaurant" SET "pin" = '008135' WHERE "pin" = '8135';

-- Ensure all PINs are exactly 6 digits (pad any remaining short PINs)
UPDATE "Restaurant" SET "pin" = LPAD("pin", 6, '0') WHERE LENGTH("pin") < 6;


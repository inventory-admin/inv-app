-- Add troubleshootingDone field to Issue
ALTER TABLE "Issue" ADD COLUMN "troubleshootingDone" BOOLEAN NOT NULL DEFAULT false;

-- Remove minStockLevel from Inventory
ALTER TABLE "Inventory" DROP COLUMN IF EXISTS "minStockLevel";

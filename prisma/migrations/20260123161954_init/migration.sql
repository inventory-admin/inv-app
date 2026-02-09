-- CreateEnum
CREATE TYPE "Location" AS ENUM ('IN_OFFICE', 'AT_SCHOOL', 'DISCARDED');

-- CreateEnum
CREATE TYPE "Condition" AS ENUM ('NEW', 'GOOD', 'DAMAGED');

-- CreateTable
CREATE TABLE "School" (
    "id" SERIAL NOT NULL,
    "schoolId" TEXT,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" SERIAL NOT NULL,
    "itemId" TEXT,
    "itemName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "location" "Location" NOT NULL DEFAULT 'IN_OFFICE',
    "isWorking" BOOLEAN NOT NULL DEFAULT true,
    "condition" "Condition" NOT NULL DEFAULT 'GOOD',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "minStockLevel" INTEGER,
    "itemTag" TEXT,
    "schoolId" INTEGER,
    "notes" TEXT,
    "lastModifiedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "School_schoolId_key" ON "School"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "School_name_key" ON "School"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_itemId_key" ON "Inventory"("itemId");

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

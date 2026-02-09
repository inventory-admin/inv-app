-- CreateEnum
CREATE TYPE "Location" AS ENUM ('IN_OFFICE', 'AT_SCHOOL', 'DISCARDED');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('UPS', 'KEYBOARD', 'MOUSE', 'CPU', 'SCREEN');

-- CreateEnum
CREATE TYPE "Condition" AS ENUM ('WORKING', 'NOT_WORKING', 'DAMAGED', 'DISCARDED');

-- CreateEnum
CREATE TYPE "IssueType" AS ENUM ('HARDWARE_FAILURE', 'SOFTWARE_ISSUE', 'PHYSICAL_DAMAGE', 'MISSING', 'OTHER');

-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

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
    "category" "Category" NOT NULL,
    "location" "Location" NOT NULL DEFAULT 'IN_OFFICE',
    "condition" "Condition" NOT NULL DEFAULT 'WORKING',
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

-- CreateTable
CREATE TABLE "Issue" (
    "id" SERIAL NOT NULL,
    "inventoryId" INTEGER NOT NULL,
    "schoolId" INTEGER,
    "issueType" "IssueType" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "IssueStatus" NOT NULL DEFAULT 'OPEN',
    "reportedBy" TEXT NOT NULL,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "School_schoolId_key" ON "School"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "School_name_key" ON "School"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_itemId_key" ON "Inventory"("itemId");

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

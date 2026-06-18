-- AlterTable
ALTER TABLE "RamadanSettings" ADD COLUMN "startDayOffset" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "RamadanSettings" ADD COLUMN "isThirtyDayMonth" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "RamadanTimetable" ADD COLUMN "hijriDay" INTEGER;

-- CreateTable
CREATE TABLE "RamadanSeasonMeta" (
    "year" INTEGER NOT NULL,
    "notesMessage" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RamadanSeasonMeta_pkey" PRIMARY KEY ("year")
);

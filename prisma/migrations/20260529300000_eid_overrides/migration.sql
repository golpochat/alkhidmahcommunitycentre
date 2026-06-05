-- AlterTable
ALTER TABLE "PrayerTimesOverride" ADD COLUMN "eidShowOnFrontend" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "EidOverride" (
    "id" TEXT NOT NULL,
    "prayerTimesOverrideId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "adhan" TEXT,
    "iqama" TEXT,
    "index" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EidOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EidOverride_prayerTimesOverrideId_index_key" ON "EidOverride"("prayerTimesOverrideId", "index");

-- AddForeignKey
ALTER TABLE "EidOverride" ADD CONSTRAINT "EidOverride_prayerTimesOverrideId_fkey" FOREIGN KEY ("prayerTimesOverrideId") REFERENCES "PrayerTimesOverride"("id") ON DELETE CASCADE ON UPDATE CASCADE;

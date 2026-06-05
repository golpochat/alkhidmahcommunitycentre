-- Rename and extend season meta into full Ramadan settings.
ALTER TABLE "RamadanSeasonMeta" RENAME TO "RamadanSettings";

ALTER TABLE "RamadanSettings" ADD COLUMN "masjidName" TEXT;
ALTER TABLE "RamadanSettings" ADD COLUMN "address" TEXT;
ALTER TABLE "RamadanSettings" ADD COLUMN "phone" TEXT;
ALTER TABLE "RamadanSettings" ADD COLUMN "email" TEXT;
ALTER TABLE "RamadanSettings" ADD COLUMN "website" TEXT;
ALTER TABLE "RamadanSettings" ADD COLUMN "donationLink" TEXT;
ALTER TABLE "RamadanSettings" ADD COLUMN "footerMessage" TEXT;

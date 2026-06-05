-- Payment QR codes per Ramadan year; slot count on settings.
ALTER TABLE "RamadanSettings" ADD COLUMN IF NOT EXISTS "qrSlotCount" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "RamadanSettings" DROP COLUMN IF EXISTS "qrCategoryIds";

CREATE TABLE IF NOT EXISTS "RamadanPaymentQR" (
  "id" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "category" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "qrImage" TEXT,
  "order" INTEGER NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RamadanPaymentQR_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RamadanPaymentQR_year_order_key" ON "RamadanPaymentQR"("year", "order");
CREATE INDEX IF NOT EXISTS "RamadanPaymentQR_year_idx" ON "RamadanPaymentQR"("year");

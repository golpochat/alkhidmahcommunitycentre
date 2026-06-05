-- Ramadan PDF: QR donation slots and longer notes (legacy footer columns kept unused).
ALTER TABLE "RamadanSettings" ADD COLUMN IF NOT EXISTS "qrDisplayCount" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "RamadanSettings" ADD COLUMN IF NOT EXISTS "qrCategoryIds" JSONB;

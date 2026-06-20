-- Legal policies CMS + privacy consent timestamps (idempotent)

CREATE TABLE IF NOT EXISTS "LegalPolicy" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "effectiveDate" TIMESTAMP(3),
    "lastReviewedAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LegalPolicy_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LegalPolicy_slug_key" ON "LegalPolicy"("slug");
CREATE INDEX IF NOT EXISTS "LegalPolicy_published_sortOrder_idx"
  ON "LegalPolicy"("published", "sortOrder");

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "privacyConsentAt" TIMESTAMP(3);
ALTER TABLE "Registration" ADD COLUMN IF NOT EXISTS "privacyConsentAt" TIMESTAMP(3);
ALTER TABLE "ContactMessage" ADD COLUMN IF NOT EXISTS "privacyConsentAt" TIMESTAMP(3);

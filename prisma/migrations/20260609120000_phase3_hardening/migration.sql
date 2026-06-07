-- Phase 3 schema + operational hardening (idempotent where possible)

DO $$ BEGIN
  CREATE TYPE "ContentAuditAction" AS ENUM ('PUBLISH', 'UNPUBLISH');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ContentAuditLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityTitle" TEXT NOT NULL,
    "action" "ContentAuditAction" NOT NULL,
    "actorEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ContentAuditLog_entityType_createdAt_idx"
  ON "ContentAuditLog"("entityType", "createdAt");
CREATE INDEX IF NOT EXISTS "ContentAuditLog_createdAt_idx"
  ON "ContentAuditLog"("createdAt");

ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "publishAt" TIMESTAMP(3);
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "unpublishAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Event_published_publishAt_idx"
  ON "Event"("published", "publishAt");
CREATE INDEX IF NOT EXISTS "Event_published_unpublishAt_idx"
  ON "Event"("published", "unpublishAt");

ALTER TABLE "Class" ADD COLUMN IF NOT EXISTS "publishAt" TIMESTAMP(3);
ALTER TABLE "Class" ADD COLUMN IF NOT EXISTS "unpublishAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Class_published_publishAt_idx"
  ON "Class"("published", "publishAt");
CREATE INDEX IF NOT EXISTS "Class_published_unpublishAt_idx"
  ON "Class"("published", "unpublishAt");

ALTER TABLE "GalleryItem" ADD COLUMN IF NOT EXISTS "published" BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS "GalleryItem_published_idx" ON "GalleryItem"("published");

ALTER TABLE "DisplaySettings" ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP(3);
ALTER TABLE "DisplaySettings" ADD COLUMN IF NOT EXISTS "lastOrientation" TEXT;

CREATE TABLE IF NOT EXISTS "ContactMessage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "handledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ContactMessage_status_createdAt_idx"
  ON "ContactMessage"("status", "createdAt");

ALTER TABLE "Donation" ADD COLUMN IF NOT EXISTS "userId" TEXT;
CREATE INDEX IF NOT EXISTS "Donation_userId_idx" ON "Donation"("userId");

DO $$ BEGIN
  ALTER TABLE "Donation"
    ADD CONSTRAINT "Donation_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN NOT NULL DEFAULT false;
UPDATE "User" SET "emailVerified" = true;

DO $$ BEGIN
  ALTER TYPE "AuthTokenType" ADD VALUE 'EMAIL_VERIFY';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add published status to events (defaults to unpublished)

ALTER TABLE "Event" ADD COLUMN "published" BOOLEAN NOT NULL DEFAULT false;

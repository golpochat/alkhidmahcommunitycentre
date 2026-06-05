-- Add published status to gallery albums and education programmes

ALTER TABLE "GalleryAlbum" ADD COLUMN "published" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Class" ADD COLUMN "published" BOOLEAN NOT NULL DEFAULT false;

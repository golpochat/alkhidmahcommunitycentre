-- Donations module refactor

DROP TABLE IF EXISTS "Donation";

CREATE TABLE "Donation" (
  "id" TEXT NOT NULL,
  "donorName" TEXT,
  "donorEmail" TEXT,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "category" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

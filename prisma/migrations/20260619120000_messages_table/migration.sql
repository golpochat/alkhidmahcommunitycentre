-- CreateEnum
CREATE TYPE "MessageState" AS ENUM ('PRIORITY', 'NON_PRIORITY');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "state" "MessageState" NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'ACTIVE',
    "includeInRotation" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "durationSeconds" INTEGER NOT NULL DEFAULT 15,
    "priorityOrder" INTEGER,
    "normalOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- Migrate legacy display notices when present
INSERT INTO "messages" (
    "id",
    "title",
    "body",
    "state",
    "status",
    "includeInRotation",
    "startsAt",
    "endsAt",
    "durationSeconds",
    "priorityOrder",
    "normalOrder",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    "title",
    "message",
    CASE
        WHEN LOWER("priority") = 'high' THEN 'PRIORITY'::"MessageState"
        ELSE 'NON_PRIORITY'::"MessageState"
    END,
    'ACTIVE'::"MessageStatus",
    true,
    "startDate",
    "endDate",
    15,
    CASE
        WHEN LOWER("priority") = 'high' THEN 0
        ELSE NULL
    END,
    CASE
        WHEN LOWER("priority") <> 'high' THEN 0
        ELSE NULL
    END,
    "createdAt",
    "updatedAt"
FROM "DisplayNotice"
WHERE EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'DisplayNotice'
);

-- Drop legacy table
DROP TABLE IF EXISTS "DisplayNotice";

-- CreateIndex
CREATE INDEX "messages_state_status_idx" ON "messages"("state", "status");

-- CreateIndex
CREATE INDEX "messages_startsAt_endsAt_idx" ON "messages"("startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "messages_priorityOrder_idx" ON "messages"("priorityOrder");

-- CreateIndex
CREATE INDEX "messages_normalOrder_idx" ON "messages"("normalOrder");

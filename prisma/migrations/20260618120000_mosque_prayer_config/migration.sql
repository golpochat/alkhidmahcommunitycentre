-- Singleton mosque prayer configuration (replaces per-date PrayerTimesOverride)

CREATE TABLE "MosquePrayerConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "dailyAdhanConfig" JSONB,
    "dailyIqamaConfig" JSONB,
    "eidType" TEXT,
    "eidDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MosquePrayerConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MosqueJumuahSlot" (
    "id" TEXT NOT NULL,
    "mosquePrayerConfigId" TEXT NOT NULL DEFAULT 'default',
    "index" INTEGER NOT NULL,
    "adhan" TEXT,
    "iqama" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MosqueJumuahSlot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MosqueEidSlot" (
    "id" TEXT NOT NULL,
    "mosquePrayerConfigId" TEXT NOT NULL DEFAULT 'default',
    "index" INTEGER NOT NULL,
    "time" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MosqueEidSlot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MosqueJumuahSlot_mosquePrayerConfigId_index_key" ON "MosqueJumuahSlot"("mosquePrayerConfigId", "index");
CREATE UNIQUE INDEX "MosqueEidSlot_mosquePrayerConfigId_index_key" ON "MosqueEidSlot"("mosquePrayerConfigId", "index");

ALTER TABLE "MosqueJumuahSlot" ADD CONSTRAINT "MosqueJumuahSlot_mosquePrayerConfigId_fkey" FOREIGN KEY ("mosquePrayerConfigId") REFERENCES "MosquePrayerConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MosqueEidSlot" ADD CONSTRAINT "MosqueEidSlot_mosquePrayerConfigId_fkey" FOREIGN KEY ("mosquePrayerConfigId") REFERENCES "MosquePrayerConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate best daily config from legacy overrides (if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'PrayerTimesOverride'
  ) THEN
    INSERT INTO "MosquePrayerConfig" ("id", "dailyAdhanConfig", "dailyIqamaConfig", "eidType", "eidDate", "updatedAt")
    SELECT
      'default',
      src."adhanConfig",
      src."iqamaConfig",
      eid."eidType",
      eid."date",
      GREATEST(src."updatedAt", COALESCE(eid."updatedAt", src."updatedAt"))
    FROM (
      SELECT *
      FROM "PrayerTimesOverride"
      WHERE "iqamaConfig" IS NOT NULL OR "adhanConfig" IS NOT NULL
      ORDER BY "updatedAt" DESC
      LIMIT 1
    ) src
    LEFT JOIN LATERAL (
      SELECT "eidType", "date", "updatedAt"
      FROM "PrayerTimesOverride"
      WHERE "eidType" IS NOT NULL
      ORDER BY "updatedAt" DESC
      LIMIT 1
    ) eid ON TRUE
    ON CONFLICT ("id") DO NOTHING;

    INSERT INTO "MosqueJumuahSlot" ("id", "mosquePrayerConfigId", "index", "adhan", "iqama", "updatedAt")
    SELECT
      j."id",
      'default',
      j."index",
      j."adhan",
      j."iqama",
      j."updatedAt"
    FROM "JumuahOverride" j
    INNER JOIN (
      SELECT "prayerTimesOverrideId"
      FROM "JumuahOverride"
      ORDER BY "updatedAt" DESC
      LIMIT 1
    ) latest ON latest."prayerTimesOverrideId" = j."prayerTimesOverrideId"
    ON CONFLICT ("mosquePrayerConfigId", "index") DO NOTHING;

    INSERT INTO "MosqueEidSlot" ("id", "mosquePrayerConfigId", "index", "time", "updatedAt")
    SELECT
      e."id",
      'default',
      e."index",
      COALESCE(e."iqama", e."adhan"),
      e."updatedAt"
    FROM "EidOverride" e
    INNER JOIN (
      SELECT p."id"
      FROM "PrayerTimesOverride" p
      WHERE p."eidType" IS NOT NULL
      ORDER BY p."updatedAt" DESC
      LIMIT 1
    ) active ON active."id" = e."prayerTimesOverrideId"
    ON CONFLICT ("mosquePrayerConfigId", "index") DO NOTHING;

    DROP TABLE IF EXISTS "JumuahOverride";
    DROP TABLE IF EXISTS "EidOverride";
    DROP TABLE IF EXISTS "PrayerTimesOverride";
  END IF;
END $$;

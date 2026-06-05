-- CreateTable
CREATE TABLE "RamadanTimetable" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "hijriDate" TEXT,
    "suhoorEnd" TEXT,
    "fajr" TEXT,
    "sunrise" TEXT,
    "dhuhr" TEXT,
    "asr" TEXT,
    "maghrib" TEXT,
    "iftar" TEXT,
    "isha" TEXT,
    "taraweeh" TEXT,
    "notes" TEXT,
    "isCommunityIftar" BOOLEAN NOT NULL DEFAULT false,
    "isOddNight" BOOLEAN NOT NULL DEFAULT false,
    "isLastTen" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RamadanTimetable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyTimetable" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "fajrAdhan" TEXT,
    "fajrIqama" TEXT,
    "dhuhrAdhan" TEXT,
    "dhuhrIqama" TEXT,
    "asrAdhan" TEXT,
    "asrIqama" TEXT,
    "maghribAdhan" TEXT,
    "maghribIqama" TEXT,
    "ishaAdhan" TEXT,
    "ishaIqama" TEXT,
    "sunrise" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyTimetable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RamadanTimetable_year_idx" ON "RamadanTimetable"("year");

-- CreateIndex
CREATE UNIQUE INDEX "RamadanTimetable_year_date_key" ON "RamadanTimetable"("year", "date");

-- CreateIndex
CREATE INDEX "MonthlyTimetable_month_year_idx" ON "MonthlyTimetable"("month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyTimetable_month_year_date_key" ON "MonthlyTimetable"("month", "year", "date");

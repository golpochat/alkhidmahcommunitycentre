import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { format } from "date-fns";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { canManagePrayerTimes, requireSession } from "@/lib/auth";
import {
  parseDateParam,
  serializeOverride,
  getDefaultPrayerTimesForDate,
  getPrayerTimesForDate,
  getActiveEidOverride,
  getActiveJumuahOverride,
} from "@/lib/prayer-times";
import { DISPLAY_PRAYER_TIMES_CACHE_TAG } from "@/lib/display-api";
import { legacyIqamaFieldsFromConfig, parseDailyIqamaConfig } from "@/lib/prayer-iqama";
import { getJumuahSaveDate } from "@/lib/prayer-times-pure";
import { prayerTimesOverrideSchema, type PrayerTimesOverrideFormValues } from "@/lib/validations";

const overrideInclude = {
  jumuahOverrides: { orderBy: { index: "asc" as const } },
  eidOverrides: { orderBy: { index: "asc" as const } },
};

function legacyEidColumns(
  eidType: "FITR" | "ADHA" | null | undefined,
  eidPrayers?: Array<{ index: number; time?: string | null }>
) {
  const slots = eidPrayers ?? [];
  const slot1 = slots.find((item) => item.index === 1)?.time ?? null;
  const slot2 = slots.find((item) => item.index === 2)?.time ?? null;

  if (eidType === "FITR") {
    return {
      eidFitrAdhan1: slot1,
      eidFitrIqama1: slot1,
      eidFitrAdhan2: slot2,
      eidFitrIqama2: slot2,
      eidAdhaAdhan1: null,
      eidAdhaIqama1: null,
      eidAdhaAdhan2: null,
      eidAdhaIqama2: null,
    };
  }

  if (eidType === "ADHA") {
    return {
      eidFitrAdhan1: null,
      eidFitrIqama1: null,
      eidFitrAdhan2: null,
      eidFitrIqama2: null,
      eidAdhaAdhan1: slot1,
      eidAdhaIqama1: slot1,
      eidAdhaAdhan2: slot2,
      eidAdhaIqama2: slot2,
    };
  }

  return {
    eidFitrAdhan1: null,
    eidFitrIqama1: null,
    eidFitrAdhan2: null,
    eidFitrIqama2: null,
    eidAdhaAdhan1: null,
    eidAdhaIqama1: null,
    eidAdhaAdhan2: null,
    eidAdhaIqama2: null,
  };
}

const clearedEidColumns = {
  eidType: null,
  eidShowOnFrontend: false,
  eidFitrAdhan1: null,
  eidFitrIqama1: null,
  eidFitrAdhan2: null,
  eidFitrIqama2: null,
  eidAdhaAdhan1: null,
  eidAdhaIqama1: null,
  eidAdhaAdhan2: null,
  eidAdhaIqama2: null,
} as const;

async function clearEidFromOtherDates(
  tx: Pick<typeof db, "prayerTimesOverride" | "eidOverride">,
  keepDate: Date
) {
  const otherEidRows = await tx.prayerTimesOverride.findMany({
    where: {
      date: { not: keepDate },
      eidType: { not: null },
    },
    select: { id: true },
  });

  if (otherEidRows.length === 0) return;

  await tx.eidOverride.deleteMany({
    where: {
      prayerTimesOverrideId: { in: otherEidRows.map((row) => row.id) },
    },
  });

  await tx.prayerTimesOverride.updateMany({
    where: { id: { in: otherEidRows.map((row) => row.id) } },
    data: clearedEidColumns,
  });
}

async function requirePrayerTimesAccess() {
  const session = await requireSession();
  if (!canManagePrayerTimes(session)) {
    throw new Error("Forbidden");
  }
  return session;
}

export async function GET(request: NextRequest) {
  try {
    await requirePrayerTimesAccess();

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    if (dateParam) {
      const defaults = await getDefaultPrayerTimesForDate(dateParam);
      const resolved = await getPrayerTimesForDate(dateParam);
      const [override, activeEidRecord, activeJumuahRecord] = await Promise.all([
        db.prayerTimesOverride.findUnique({
          where: { date: parseDateParam(dateParam) },
          include: overrideInclude,
        }),
        getActiveEidOverride(),
        getActiveJumuahOverride(),
      ]);

      return NextResponse.json({
        defaults,
        resolved,
        override: override ? serializeOverride(override) : null,
        activeEid: activeEidRecord ? serializeOverride(activeEidRecord) : null,
        activeJumuah: activeJumuahRecord ? serializeOverride(activeJumuahRecord) : null,
      });
    }

    const overrides = await db.prayerTimesOverride.findMany({
      include: overrideInclude,
      orderBy: { date: "desc" },
    });

    return NextResponse.json(overrides.map(serializeOverride));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

const clearedDailyColumns = {
  fajrAdhan: null,
  fajrIqama: null,
  dhuhrAdhan: null,
  dhuhrIqama: null,
  asrAdhan: null,
  asrIqama: null,
  maghribAdhan: null,
  maghribIqama: null,
  ishaAdhan: null,
  ishaIqama: null,
  iqamaConfig: Prisma.DbNull,
  adhanConfig: Prisma.DbNull,
} as const;

type OverrideSection = "daily" | "jumuah" | "eid";

function buildDailyFields(validated: PrayerTimesOverrideFormValues) {
  const iqamaConfig = (validated.iqamaConfig ?? undefined) as
    | Prisma.InputJsonValue
    | undefined;
  const adhanConfig = (validated.adhanConfig ?? undefined) as
    | Prisma.InputJsonValue
    | undefined;
  const legacyIqama = validated.iqamaConfig
    ? legacyIqamaFieldsFromConfig(parseDailyIqamaConfig(validated.iqamaConfig) ?? {})
    : {};

  return {
    fajrAdhan: null,
    fajrIqama: legacyIqama.fajrIqama ?? validated.fajrIqama ?? null,
    dhuhrAdhan: null,
    dhuhrIqama: legacyIqama.dhuhrIqama ?? validated.dhuhrIqama ?? null,
    asrAdhan: null,
    asrIqama: legacyIqama.asrIqama ?? validated.asrIqama ?? null,
    maghribAdhan: null,
    maghribIqama: legacyIqama.maghribIqama ?? validated.maghribIqama ?? null,
    ishaAdhan: null,
    ishaIqama: legacyIqama.ishaIqama ?? validated.ishaIqama ?? null,
    iqamaConfig,
    adhanConfig,
  };
}

async function resetOverrideSection(
  section: OverrideSection,
  body: Record<string, unknown>
) {
  if (section === "daily") {
    const date = parseDateParam(String(body.date));
    const existing = await db.prayerTimesOverride.findUnique({ where: { date } });
    if (!existing) return;

    await db.prayerTimesOverride.update({
      where: { id: existing.id },
      data: clearedDailyColumns,
    });
    return;
  }

  if (section === "jumuah") {
    const jumuahDate = parseDateParam(
      String(body.jumuahDate ?? getJumuahSaveDate())
    );
    const existing = await db.prayerTimesOverride.findUnique({
      where: { date: jumuahDate },
    });
    if (!existing) return;

    await db.jumuahOverride.deleteMany({
      where: { prayerTimesOverrideId: existing.id },
    });
    return;
  }

  const eidDate = parseDateParam(String(body.eidDate ?? body.date));
  const existing = await db.prayerTimesOverride.findUnique({ where: { date: eidDate } });
  if (!existing) return;

  await db.$transaction(async (tx) => {
    await tx.eidOverride.deleteMany({
      where: { prayerTimesOverrideId: existing.id },
    });
    await tx.prayerTimesOverride.update({
      where: { id: existing.id },
      data: clearedEidColumns,
    });
  });
}

async function saveDailySection(
  tx: Prisma.TransactionClient,
  validated: PrayerTimesOverrideFormValues
) {
  const dailyDate = parseDateParam(validated.date);
  const dailyFields = buildDailyFields(validated);

  return tx.prayerTimesOverride.upsert({
    where: { date: dailyDate },
    create: {
      date: dailyDate,
      ...dailyFields,
    },
    update: dailyFields,
  });
}

async function saveJumuahSection(
  tx: Prisma.TransactionClient,
  validated: PrayerTimesOverrideFormValues
) {
  const jumuahDate = parseDateParam(
    validated.jumuahDate ?? getJumuahSaveDate()
  );
  const jumuahOverride = await tx.prayerTimesOverride.upsert({
    where: { date: jumuahDate },
    create: { date: jumuahDate },
    update: {},
  });

  await tx.jumuahOverride.deleteMany({
    where: { prayerTimesOverrideId: jumuahOverride.id },
  });

  if (validated.jumuah?.length) {
    await tx.jumuahOverride.createMany({
      data: validated.jumuah.map((item) => ({
        prayerTimesOverrideId: jumuahOverride.id,
        date: jumuahDate,
        index: item.index,
        adhan: item.adhan ?? null,
        iqama: item.iqama ?? item.adhan ?? null,
      })),
    });
  }

  await tx.jumuahOverride.deleteMany({
    where: { prayerTimesOverrideId: { not: jumuahOverride.id } },
  });

  await tx.prayerTimesOverride.update({
    where: { id: jumuahOverride.id },
    data: { eidShowOnFrontend: jumuahOverride.eidShowOnFrontend },
  });

  return jumuahOverride;
}

async function saveEidSection(
  tx: Prisma.TransactionClient,
  validated: PrayerTimesOverrideFormValues
) {
  const eidDate = parseDateParam(validated.eidDate ?? validated.date);
  const legacyEid = legacyEidColumns(validated.eidType, validated.eidPrayers);
  const eidFields = validated.eidType
    ? {
        eidType: validated.eidType,
        eidShowOnFrontend: true,
        ...legacyEid,
      }
    : null;

  if (!eidFields) return null;

  const eidOverride = await tx.prayerTimesOverride.upsert({
    where: { date: eidDate },
    create: {
      date: eidDate,
      ...eidFields,
    },
    update: eidFields,
  });

  await tx.eidOverride.deleteMany({
    where: { prayerTimesOverrideId: eidOverride.id },
  });

  if (validated.eidPrayers?.length) {
    await tx.eidOverride.createMany({
      data: validated.eidPrayers
        .filter((item) => item.time)
        .map((item) => ({
          prayerTimesOverrideId: eidOverride.id,
          date: eidDate,
          index: item.index,
          adhan: item.time ?? null,
          iqama: item.time ?? null,
        })),
    });
  }

  await clearEidFromOtherDates(tx, eidDate);
  return eidOverride;
}

async function saveAllSections(validated: PrayerTimesOverrideFormValues) {
  const dailyDate = parseDateParam(validated.date);
  const eidDate = parseDateParam(validated.eidDate ?? validated.date);
  const jumuahDate = parseDateParam(
    validated.jumuahDate ?? getJumuahSaveDate()
  );
  const dailyFields = buildDailyFields(validated);
  const legacyEid = legacyEidColumns(validated.eidType, validated.eidPrayers);
  const eidFields = validated.eidType
    ? {
        eidType: validated.eidType,
        eidShowOnFrontend: true,
        ...legacyEid,
      }
    : null;
  const sameRow = dailyDate.getTime() === eidDate.getTime();
  const jumuahOnDailyRow = dailyDate.getTime() === jumuahDate.getTime();

  return db.$transaction(async (tx) => {
    const dailyOverride = await tx.prayerTimesOverride.upsert({
      where: { date: dailyDate },
      create: {
        date: dailyDate,
        ...dailyFields,
        ...(sameRow && eidFields ? eidFields : {}),
      },
      update: {
        ...dailyFields,
        ...(sameRow && eidFields ? eidFields : {}),
      },
    });

    await tx.jumuahOverride.deleteMany({
      where: { prayerTimesOverrideId: dailyOverride.id },
    });

    if (jumuahOnDailyRow && validated.jumuah?.length) {
      await tx.jumuahOverride.createMany({
        data: validated.jumuah.map((item) => ({
          prayerTimesOverrideId: dailyOverride.id,
          date: jumuahDate,
          index: item.index,
          adhan: item.adhan ?? null,
          iqama: item.iqama ?? null,
        })),
      });
    }

    if (!jumuahOnDailyRow && validated.jumuah?.length) {
      await saveJumuahSection(tx, validated);
    }

    if (eidFields && !sameRow) {
      await saveEidSection(tx, validated);
    } else if (eidFields && sameRow) {
      await tx.eidOverride.deleteMany({
        where: { prayerTimesOverrideId: dailyOverride.id },
      });

      if (validated.eidPrayers?.length) {
        await tx.eidOverride.createMany({
          data: validated.eidPrayers
            .filter((item) => item.time)
            .map((item) => ({
              prayerTimesOverrideId: dailyOverride.id,
              date: eidDate,
              index: item.index,
              adhan: item.time ?? null,
              iqama: item.time ?? null,
            })),
        });
      }

      await clearEidFromOtherDates(tx, eidDate);
    }

    return tx.prayerTimesOverride.findUnique({
      where: { id: dailyOverride.id },
      include: overrideInclude,
    });
  });
}

export async function POST(request: NextRequest) {
  try {
    await requirePrayerTimesAccess();
    const body = await request.json();

    if (body.action === "reset") {
      const section = body.section as OverrideSection | undefined;

      if (section) {
        await resetOverrideSection(section, body);
        revalidateTag(DISPLAY_PRAYER_TIMES_CACHE_TAG);
        return NextResponse.json({ success: true });
      }

      const date = parseDateParam(body.date);
      const existing = await db.prayerTimesOverride.findUnique({ where: { date } });

      if (!existing) {
        return NextResponse.json({ success: true, message: "No override to reset" });
      }

      await db.$transaction(async (tx) => {
        await tx.jumuahOverride.deleteMany({
          where: { prayerTimesOverrideId: existing.id },
        });
        await tx.eidOverride.deleteMany({
          where: { prayerTimesOverrideId: existing.id },
        });

        await tx.prayerTimesOverride.update({
          where: { id: existing.id },
          data: {
            ...clearedEidColumns,
            ...clearedDailyColumns,
          },
        });
      });

      revalidateTag(DISPLAY_PRAYER_TIMES_CACHE_TAG);
      return NextResponse.json({ success: true });
    }

    const validated = prayerTimesOverrideSchema.parse(body);
    const section = validated.section;

    if (section === "daily") {
      await db.$transaction(async (tx) => {
        await saveDailySection(tx, validated);
      });
    } else if (section === "jumuah") {
      await db.$transaction(async (tx) => {
        await saveJumuahSection(tx, validated);
      });
    } else if (section === "eid") {
      await db.$transaction(async (tx) => {
        await saveEidSection(tx, validated);
      });
    } else {
      await saveAllSections(validated);
    }

    const activeEid = await getActiveEidOverride();
    const activeJumuah = await getActiveJumuahOverride();
    const dailyOverride = await db.prayerTimesOverride.findUnique({
      where: { date: parseDateParam(validated.date) },
      include: overrideInclude,
    });

    revalidateTag(DISPLAY_PRAYER_TIMES_CACHE_TAG);

    return NextResponse.json(
      {
        daily: dailyOverride ? serializeOverride(dailyOverride) : null,
        activeEid: activeEid ? serializeOverride(activeEid) : null,
        activeJumuah: activeJumuah ? serializeOverride(activeJumuah) : null,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid data";
    const status = message === "Unauthorized" || message === "Forbidden" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requirePrayerTimesAccess();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const dateParam = searchParams.get("date");

    if (id) {
      await db.prayerTimesOverride.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    if (dateParam) {
      await db.prayerTimesOverride.delete({ where: { date: parseDateParam(dateParam) } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "ID or date required" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    const status = message === "Unauthorized" || message === "Forbidden" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}


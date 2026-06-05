import "server-only";

import { format, parseISO } from "date-fns";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  buildDailyAdhanConfigFromOverride,
  defaultAdhanConfig,
  resolveAdhan,
  type DailyPrayerKey,
} from "@/lib/prayer-adhan";
import {
  buildDailyIqamaConfigFromOverride,
  resolvePrayerSlotWithIqama,
} from "@/lib/prayer-iqama";
import {
  buildEidInfoFromRecord,
  buildScheduleDates,
  buildSlot,
  defaultJumuahSlots,
  findNextPrayer,
  hasDailyOverrideData,
  isEidVisibleForToday,
  isFriday,
  mapJumuahOverrides,
  normalizeTime,
  parseDateParam,
  toDateKey,
  toRecordDateKey,
  type EidInfo,
  type JumuahSlot,
  type OverrideRecord,
  type PrayerSlot,
  type PrayerTimesResponse,
} from "@/lib/prayer-times-pure";
import { fetchAlAdhan } from "@/lib/prayer-times-aladhan";
import type { DailyIqamaConfig } from "@/lib/prayer-iqama";
import type { AlAdhanTimings, AlAdhanResponse } from "@/types";
import type { DbPrayerTimesOverrideRecord } from "@/lib/prayer-times-pure";

export * from "@/lib/prayer-times-pure";

type AlAdhanSource = {
  apiTimings: AlAdhanTimings;
  hijri: AlAdhanResponse["data"]["date"]["hijri"] | null;
  degraded: boolean;
};

function buildDateLabels(
  dateKey: string,
  hijri: AlAdhanResponse["data"]["date"]["hijri"] | null
) {
  if (hijri) {
    return buildScheduleDates(dateKey, hijri);
  }

  return {
    englishDate: format(parseISO(dateKey), "EEEE d MMMM yyyy"),
    hijriDate: null,
    hijriDateArabic: null,
  };
}

async function getStoredTimingsForDate(date: Date) {
  const override = await db.prayerTimesOverride.findUnique({
    where: { date },
  });

  if (override?.fajrAdhan && override?.maghribAdhan) {
    return {
      apiTimings: {
        Fajr: override.fajrAdhan,
        Sunrise: "",
        Dhuhr: override.dhuhrAdhan ?? "",
        Asr: override.asrAdhan ?? "",
        Maghrib: override.maghribAdhan,
        Isha: override.ishaAdhan ?? "",
      },
      hijri: null,
    };
  }

  const monthly = await db.monthlyTimetable.findFirst({
    where: { date },
  });

  if (monthly?.fajrAdhan && monthly?.maghribAdhan) {
    return {
      apiTimings: {
        Fajr: monthly.fajrAdhan,
        Sunrise: monthly.sunrise ?? "",
        Dhuhr: monthly.dhuhrAdhan ?? "",
        Asr: monthly.asrAdhan ?? "",
        Maghrib: monthly.maghribAdhan,
        Isha: monthly.ishaAdhan ?? "",
      },
      hijri: null,
    };
  }

  const ramadan = await db.ramadanTimetable.findFirst({
    where: { date },
  });

  if (ramadan?.fajr && ramadan?.maghrib) {
    return {
      apiTimings: {
        Fajr: ramadan.fajr,
        Sunrise: ramadan.sunrise ?? "",
        Dhuhr: ramadan.dhuhr ?? "",
        Asr: ramadan.asr ?? "",
        Maghrib: ramadan.maghrib,
        Isha: ramadan.isha ?? "",
      },
      hijri: null,
    };
  }

  return null;
}

async function resolveAlAdhanSource(date: Date): Promise<AlAdhanSource> {
  try {
    const aladhan = await fetchAlAdhan(date);
    return {
      apiTimings: aladhan.data.timings,
      hijri: aladhan.data.date.hijri,
      degraded: false,
    };
  } catch {
    const stored = await getStoredTimingsForDate(date);
    if (stored) {
      return {
        ...stored,
        degraded: true,
      };
    }

    throw new Error(
      "Prayer times are temporarily unavailable. Please try again shortly."
    );
  }
}

function overrideRelationsInclude(): Prisma.PrayerTimesOverrideInclude {
  return {
    jumuahOverrides: { orderBy: { index: "asc" } },
    eidOverrides: { orderBy: { index: "asc" } },
  } as Prisma.PrayerTimesOverrideInclude;
}

export async function resolveConfiguredJumuahSlots(): Promise<JumuahSlot[]> {
  const activeJumuah = await getActiveJumuahOverride();
  if (activeJumuah?.jumuahOverrides?.length) {
    return mapJumuahOverrides(activeJumuah.jumuahOverrides);
  }

  return defaultJumuahSlots();
}

export async function getActiveEidOverride() {
  return db.prayerTimesOverride.findFirst({
    where: { eidType: { not: null } },
    orderBy: { date: "asc" },
    include: overrideRelationsInclude(),
  }) as Promise<DbPrayerTimesOverrideRecord | null>;
}

export async function getActiveJumuahOverride() {
  return db.prayerTimesOverride.findFirst({
    where: { jumuahOverrides: { some: {} } },
    orderBy: { updatedAt: "desc" },
    include: {
      jumuahOverrides: { orderBy: { index: "asc" } },
    },
  }) as Promise<DbPrayerTimesOverrideRecord | null>;
}

async function resolveEidForDisplay(
  dateKey: string,
  date: Date,
  override: (OverrideRecord & { date?: Date }) | null
): Promise<EidInfo> {
  const today = parseDateParam();
  const todayKey = toDateKey(today);
  const isViewingToday = dateKey === todayKey;

  if (isViewingToday) {
    const candidates = await db.prayerTimesOverride.findMany({
      where: { eidType: { not: null } },
      orderBy: { date: "asc" },
      include: overrideRelationsInclude(),
    });

    const visibleEid = candidates.find((record) =>
      isEidVisibleForToday(record.date, today)
    );

    if (visibleEid) {
      const eidDateKey = toRecordDateKey(visibleEid.date);
      return buildEidInfoFromRecord(visibleEid, {
        isUpcoming: eidDateKey !== todayKey,
      });
    }

    return { type: null, prayers: [] };
  }

  if (override?.eidType) {
    return buildEidInfoFromRecord(
      { ...override, date: override.date ?? date },
      { isUpcoming: false }
    );
  }

  return { type: null, prayers: [] };
}

export async function getDefaultPrayerTimesForDate(
  dateParam?: string | null
): Promise<PrayerTimesResponse> {
  const date = parseDateParam(dateParam);
  const dateKey = toDateKey(date);
  const friday = isFriday(date);

  const { apiTimings, hijri, degraded } = await resolveAlAdhanSource(date);
  const dates = buildDateLabels(dateKey, hijri);
  const sunrise = normalizeTime(apiTimings.Sunrise);

  const configuredJumuah = await resolveConfiguredJumuahSlots();
  const jumuah = friday ? configuredJumuah : [];
  const replaceDhuhrWithJumuah = friday && jumuah.length > 0;

  const response: PrayerTimesResponse = {
    date: dateKey,
    ...dates,
    sunrise,
    isFriday: friday,
    prayers: {
      fajr: buildSlot(apiTimings.Fajr, null, true),
      dhuhr: replaceDhuhrWithJumuah
        ? null
        : buildSlot(apiTimings.Dhuhr, null, true),
      asr: buildSlot(apiTimings.Asr, null, true),
      maghrib: buildSlot(apiTimings.Maghrib, null, true),
      isha: buildSlot(apiTimings.Isha, null, true),
    },
    jumuah,
    configuredJumuah,
    eid: { type: null, prayers: [] },
    nextPrayer: null,
    degraded,
    warning: degraded
      ? "Showing saved timetable times. Live AlAdhan data is temporarily unavailable."
      : undefined,
  };

  response.nextPrayer = findNextPrayer(response);
  return response;
}

export async function getPrayerTimesForDate(
  dateParam?: string | null
): Promise<PrayerTimesResponse> {
  const date = parseDateParam(dateParam);
  const dateKey = toDateKey(date);
  const friday = isFriday(date);

  const override = (await db.prayerTimesOverride.findUnique({
    where: { date },
    include: overrideRelationsInclude(),
  })) as DbPrayerTimesOverrideRecord | null;

  const useDailyOverride = hasDailyOverrideData(override);

  const { apiTimings, hijri, degraded } = await resolveAlAdhanSource(date);
  const dates = buildDateLabels(dateKey, hijri);
  const sunrise = normalizeTime(apiTimings.Sunrise);

  let jumuah: JumuahSlot[] = [];

  if (friday) {
    if (override?.jumuahOverrides?.length) {
      jumuah = mapJumuahOverrides(override.jumuahOverrides);
    } else {
      jumuah = await resolveConfiguredJumuahSlots();
    }
  }

  const configuredJumuah = await resolveConfiguredJumuahSlots();

  const replaceDhuhrWithJumuah = friday && jumuah.length > 0;

  const adhanConfig = override
    ? buildDailyAdhanConfigFromOverride(override, {
        Fajr: apiTimings.Fajr,
        Dhuhr: apiTimings.Dhuhr,
        Asr: apiTimings.Asr,
        Maghrib: apiTimings.Maghrib,
        Isha: apiTimings.Isha,
      })
    : defaultAdhanConfig();

  const iqamaConfig = override
    ? buildDailyIqamaConfigFromOverride(override)
    : ({} as DailyIqamaConfig);

  const buildDailySlot = (
    prayer: DailyPrayerKey,
    apiAdhan: string,
    maghribSlot?: PrayerSlot | null
  ): PrayerSlot => {
    const adhan =
      useDailyOverride && override
        ? resolveAdhan(apiAdhan, adhanConfig[prayer])
        : normalizeTime(apiAdhan);

    if (useDailyOverride && override) {
      return resolvePrayerSlotWithIqama(adhan, iqamaConfig[prayer], {
        legacyIqama: override[`${prayer}Iqama` as keyof OverrideRecord] as string | null,
        deriveDefault: true,
        maghribSlot: maghribSlot,
      });
    }

    return buildSlot(adhan, null, true);
  };

  const maghrib = buildDailySlot("maghrib", apiTimings.Maghrib);

  const prayers = {
    fajr: buildDailySlot("fajr", apiTimings.Fajr),
    dhuhr: replaceDhuhrWithJumuah
      ? null
      : buildDailySlot("dhuhr", apiTimings.Dhuhr),
    asr: buildDailySlot("asr", apiTimings.Asr),
    maghrib,
    isha: buildDailySlot("isha", apiTimings.Isha, maghrib),
  };

  const eid = await resolveEidForDisplay(dateKey, date, override);

  const response: PrayerTimesResponse = {
    date: dateKey,
    ...dates,
    sunrise,
    isFriday: friday,
    prayers,
    jumuah,
    configuredJumuah,
    eid,
    nextPrayer: null,
    degraded,
    warning: degraded
      ? "Showing saved timetable times. Live AlAdhan data is temporarily unavailable."
      : undefined,
  };

  response.nextPrayer = findNextPrayer(response);

  return response;
}

export async function getLastEidPrayerTimes(): Promise<PrayerTimesResponse | null> {
  const lastEid = await db.prayerTimesOverride.findFirst({
    where: { eidType: { not: null } },
    orderBy: { date: "desc" },
  });

  if (!lastEid) return null;

  return getPrayerTimesForDate(format(lastEid.date, "yyyy-MM-dd"));
}

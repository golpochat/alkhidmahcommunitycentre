import "server-only";

import { format, parseISO } from "date-fns";
import { db } from "@/lib/db";
import {
  defaultAdhanConfig,
  resolveAdhanSlot,
  type DailyPrayerKey,
} from "@/lib/prayer-adhan";
import {
  getDefaultIqamaOffsetMinutes,
  resolvePrayerSlotWithIqama,
} from "@/lib/prayer-iqama";
import {
  getDailyAdhanConfigFromMosque,
  getDailyIqamaConfigFromMosque,
  getMosquePrayerConfig,
  hasSavedDailyPrayerRules,
  type MosquePrayerConfigWithRelations,
} from "@/lib/mosque-prayer-config";
import {
  addMinutesToTime,
  buildEidInfoFromRecord,
  buildScheduleDates,
  defaultJumuahSlots,
  findNextPrayer,
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
import type { AlAdhanTimings, AlAdhanResponse } from "@/types";

export * from "@/lib/prayer-times-pure";
export {
  getMosquePrayerConfig,
  serializeMosquePrayerConfig,
  hasSavedDailyPrayerRules,
} from "@/lib/mosque-prayer-config";

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

function mosqueEidRecord(config: MosquePrayerConfigWithRelations | null): OverrideRecord | null {
  if (!config?.eidType) return null;

  return {
    eidType: config.eidType,
    eidDate: config.eidDate,
    eidPrayers: config.eidSlots.map((slot) => ({
      index: slot.index,
      time: slot.time || "",
    })),
    eidOverrides: config.eidSlots.map((slot) => ({
      index: slot.index,
      adhan: slot.time,
      iqama: slot.time,
    })),
  };
}

export async function resolveConfiguredJumuahSlots(): Promise<JumuahSlot[]> {
  const config = await getMosquePrayerConfig();
  if (config?.jumuahSlots.length) {
    return mapJumuahOverrides(config.jumuahSlots);
  }

  return defaultJumuahSlots();
}

export async function getMosquePrayerConfigRecord() {
  const config = await getMosquePrayerConfig();
  return config;
}

async function resolveEidForDisplay(
  dateKey: string,
  config: MosquePrayerConfigWithRelations | null
): Promise<EidInfo> {
  const record = mosqueEidRecord(config);
  if (!record?.eidType || !config?.eidDate) {
    return { type: null, prayers: [] };
  }

  const today = parseDateParam();
  const todayKey = toDateKey(today);
  const isViewingToday = dateKey === todayKey;

  if (isViewingToday && !isEidVisibleForToday(config.eidDate, today)) {
    return { type: null, prayers: [] };
  }

  const eidDateKey = toRecordDateKey(config.eidDate);
  return buildEidInfoFromRecord(record, {
    isUpcoming: isViewingToday && eidDateKey !== todayKey,
  });
}

function buildDefaultDailySlot(prayer: DailyPrayerKey, apiAdhan: string): PrayerSlot {
  const adhan = normalizeTime(apiAdhan);
  const iqama = adhan
    ? addMinutesToTime(adhan, getDefaultIqamaOffsetMinutes(prayer))
    : null;

  return {
    adhan,
    iqama,
    adhanDisplay: adhan,
    iqamaDisplay: iqama,
  };
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
      fajr: buildDefaultDailySlot("fajr", apiTimings.Fajr),
      dhuhr: replaceDhuhrWithJumuah
        ? null
        : buildDefaultDailySlot("dhuhr", apiTimings.Dhuhr),
      asr: buildDefaultDailySlot("asr", apiTimings.Asr),
      maghrib: buildDefaultDailySlot("maghrib", apiTimings.Maghrib),
      isha: buildDefaultDailySlot("isha", apiTimings.Isha),
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

  const config = await getMosquePrayerConfig();
  const applySavedRules = hasSavedDailyPrayerRules(config);

  const { apiTimings, hijri, degraded } = await resolveAlAdhanSource(date);
  const dates = buildDateLabels(dateKey, hijri);
  const sunrise = normalizeTime(apiTimings.Sunrise);

  const jumuah = friday ? await resolveConfiguredJumuahSlots() : [];
  const configuredJumuah = await resolveConfiguredJumuahSlots();
  const replaceDhuhrWithJumuah = friday && jumuah.length > 0;

  const adhanConfig = applySavedRules
    ? getDailyAdhanConfigFromMosque(config)
    : defaultAdhanConfig();

  const iqamaConfig = applySavedRules
    ? getDailyIqamaConfigFromMosque(config)
    : null;

  const buildDailySlot = (
    prayer: DailyPrayerKey,
    apiAdhan: string,
    maghribSlot?: PrayerSlot | null
  ): PrayerSlot => {
    if (!applySavedRules) {
      return buildDefaultDailySlot(prayer, apiAdhan);
    }

    const { adhan, adhanDisplay } = resolveAdhanSlot(
      apiAdhan,
      adhanConfig[prayer],
    );
    const slot = resolvePrayerSlotWithIqama(adhan, iqamaConfig?.[prayer], {
      deriveDefault: true,
      maghribSlot,
    });

    return {
      ...slot,
      adhanDisplay: adhanDisplay ?? slot.adhan,
    };
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

  const eid = await resolveEidForDisplay(dateKey, config);

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
  const config = await getMosquePrayerConfig();
  if (!config?.eidType || !config.eidDate) return null;

  return getPrayerTimesForDate(format(config.eidDate, "yyyy-MM-dd"));
}

function buildStoredPrayerSlot(
  adhan?: string | null,
  iqama?: string | null
): PrayerSlot {
  const normalizedAdhan = normalizeTime(adhan);
  const normalizedIqama = normalizeTime(iqama);

  return {
    adhan: normalizedAdhan,
    iqama: normalizedIqama,
    iqamaDisplay: normalizedIqama,
  };
}

async function buildPrayerTimesFromMonthlyRow(
  date: Date,
  dateKey: string,
  row: {
    fajrAdhan: string | null;
    fajrIqama: string | null;
    dhuhrAdhan: string | null;
    dhuhrIqama: string | null;
    asrAdhan: string | null;
    asrIqama: string | null;
    maghribAdhan: string | null;
    maghribIqama: string | null;
    ishaAdhan: string | null;
    ishaIqama: string | null;
    sunrise: string | null;
  }
): Promise<PrayerTimesResponse> {
  const friday = isFriday(date);
  let dates = buildDateLabels(dateKey, null);

  try {
    const aladhan = await fetchAlAdhan(date);
    dates = buildDateLabels(dateKey, aladhan.data.date.hijri);
  } catch {
    // English date only when Hijri lookup is unavailable
  }

  const jumuah = friday ? await resolveConfiguredJumuahSlots() : [];
  const replaceDhuhrWithJumuah = friday && jumuah.length > 0;
  const config = await getMosquePrayerConfig();
  const eid = await resolveEidForDisplay(dateKey, config);

  const response: PrayerTimesResponse = {
    date: dateKey,
    ...dates,
    sunrise: normalizeTime(row.sunrise),
    isFriday: friday,
    prayers: {
      fajr: buildStoredPrayerSlot(row.fajrAdhan, row.fajrIqama),
      dhuhr: replaceDhuhrWithJumuah
        ? null
        : buildStoredPrayerSlot(row.dhuhrAdhan, row.dhuhrIqama),
      asr: buildStoredPrayerSlot(row.asrAdhan, row.asrIqama),
      maghrib: buildStoredPrayerSlot(row.maghribAdhan, row.maghribIqama),
      isha: buildStoredPrayerSlot(row.ishaAdhan, row.ishaIqama),
    },
    jumuah,
    configuredJumuah: await resolveConfiguredJumuahSlots(),
    eid,
    nextPrayer: null,
    degraded: false,
  };

  response.nextPrayer = findNextPrayer(response);
  return response;
}

/** TV display: prefer live mosque rules, then monthly timetable row, then API defaults. */
export async function getPrayerTimesForDisplay(
  dateParam?: string | null
): Promise<PrayerTimesResponse> {
  const date = parseDateParam(dateParam);
  const dateKey = toDateKey(date);

  const config = await getMosquePrayerConfig();
  if (hasSavedDailyPrayerRules(config)) {
    return getPrayerTimesForDate(dateParam);
  }

  const monthly = await db.monthlyTimetable.findFirst({
    where: { date },
  });

  if (monthly?.fajrAdhan) {
    return buildPrayerTimesFromMonthlyRow(date, dateKey, monthly);
  }

  return getPrayerTimesForDate(dateParam);
}

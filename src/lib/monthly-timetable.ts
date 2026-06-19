import "server-only";

import {
  format,
} from "date-fns";
import { db } from "@/lib/db";
import { getPrayerTimesForDate } from "@/lib/prayer-times";
import {
  addMinutesToTime,
  buildDateKey,
  formatAdhanDisplay,
  formatPrayerTime24h,
  getGregorianMonthDayCount,
  IQAMA_OFFSET_MINUTES,
  normalizeTime,
  parseAlAdhanGregorianDate,
  parseDateKey,
  toRecordDateKey,
  type PrayerSlot,
  type PrayerTimesResponse,
} from "@/lib/prayer-times-pure";
import { formatIqamaDisplay } from "@/lib/prayer-iqama";
import { fetchAlAdhanGregorianCalendar } from "@/lib/prayer-times-aladhan";
import { getSettingsMap } from "@/lib/queries";
import { SETTING_KEYS } from "@/lib/settings";

export interface MonthlyDayRow {
  id?: string;
  date: string;
  dayName: string;
  fajrAdhan: string;
  fajrIqama: string;
  sunrise: string;
  dhuhrAdhan: string;
  dhuhrIqama: string;
  asrAdhan: string;
  asrIqama: string;
  maghribAdhan: string;
  maghribIqama: string;
  ishaAdhan: string;
  ishaIqama: string;
  notes: string;
  isFriday: boolean;
}

function defaultIqama(adhan: string) {
  const normalized = normalizeTime(adhan);
  if (!normalized || !/^\d{2}:\d{2}$/.test(normalized)) {
    return "";
  }

  return addMinutesToTime(normalized, IQAMA_OFFSET_MINUTES);
}

function monthlyAdhanValue(slot: PrayerSlot, apiFallback: string) {
  const display = formatAdhanDisplay(slot);
  if (display !== "—") {
    const normalized = normalizeTime(display);
    if (normalized && /^\d{2}:\d{2}$/.test(normalized)) {
      return normalized;
    }
    return display;
  }
  return normalizeTime(apiFallback) ?? "";
}

function monthlyIqamaValue(slot: PrayerSlot, adhanFallback: string) {
  const display = formatIqamaDisplay(slot);
  if (display !== "—") {
    const normalized = normalizeTime(display);
    if (normalized && /^\d{2}:\d{2}$/.test(normalized)) {
      return normalized;
    }
    return display;
  }

  const iqama = normalizeTime(slot.iqama);
  if (iqama && /^\d{2}:\d{2}$/.test(iqama)) {
    return iqama;
  }

  return defaultIqama(adhanFallback);
}

function resolveMonthlyJumuahDhuhr(resolved: PrayerTimesResponse) {
  const slots = [...resolved.jumuah].sort((a, b) => a.index - b.index);
  const adhanTimes = slots
    .map((slot) => normalizeTime(slot.adhan))
    .filter((time): time is string => Boolean(time && /^\d{2}:\d{2}$/.test(time)));
  const iqamaTimes = slots
    .map((slot) => normalizeTime(slot.iqama ?? slot.adhan))
    .filter((time): time is string => Boolean(time && /^\d{2}:\d{2}$/.test(time)));

  if (iqamaTimes.length > 0) {
    return {
      adhan: adhanTimes[0] ?? iqamaTimes[0],
      iqama: iqamaTimes.map((time) => formatPrayerTime24h(time)).join(" / "),
    };
  }

  if (adhanTimes.length > 0) {
    return {
      adhan: adhanTimes[0],
      iqama: defaultIqama(adhanTimes[0]) || "Jumu'ah",
    };
  }

  return {
    adhan: "Jumu'ah",
    iqama: "Jumu'ah",
  };
}

async function buildMonthlyRowFromDailyPrayerTimes(
  dateKey: string,
  apiTimings: {
    Fajr: string;
    Sunrise: string;
    Dhuhr: string;
    Asr: string;
    Maghrib: string;
    Isha: string;
  }
): Promise<MonthlyDayRow> {
  const date = parseDateKey(dateKey);
  const resolved = await getPrayerTimesForDate(dateKey);
  const emptyDhuhrSlot: PrayerSlot = {
    adhan: null,
    iqama: null,
    iqamaDisplay: null,
  };
  const dhuhrSlot = resolved.prayers.dhuhr ?? emptyDhuhrSlot;
  const dhuhrAdhanFallback =
    normalizeTime(resolved.prayers.dhuhr?.adhan) ?? apiTimings.Dhuhr;
  const jumuahDhuhr =
    resolved.isFriday && resolved.jumuah.length > 0
      ? resolveMonthlyJumuahDhuhr(resolved)
      : null;

  return {
    date: dateKey,
    dayName: format(date, "EEEE"),
    fajrAdhan: monthlyAdhanValue(resolved.prayers.fajr, apiTimings.Fajr),
    fajrIqama: monthlyIqamaValue(
      resolved.prayers.fajr,
      normalizeTime(resolved.prayers.fajr.adhan) ?? apiTimings.Fajr,
    ),
    sunrise: normalizeTime(resolved.sunrise ?? apiTimings.Sunrise) ?? "",
    dhuhrAdhan:
      jumuahDhuhr?.adhan ??
      monthlyAdhanValue(dhuhrSlot, apiTimings.Dhuhr),
    dhuhrIqama:
      jumuahDhuhr?.iqama ??
      monthlyIqamaValue(dhuhrSlot, dhuhrAdhanFallback),
    asrAdhan: monthlyAdhanValue(resolved.prayers.asr, apiTimings.Asr),
    asrIqama: monthlyIqamaValue(
      resolved.prayers.asr,
      normalizeTime(resolved.prayers.asr.adhan) ?? apiTimings.Asr,
    ),
    maghribAdhan: monthlyAdhanValue(resolved.prayers.maghrib, apiTimings.Maghrib),
    maghribIqama: monthlyIqamaValue(
      resolved.prayers.maghrib,
      normalizeTime(resolved.prayers.maghrib.adhan) ?? apiTimings.Maghrib,
    ),
    ishaAdhan: monthlyAdhanValue(resolved.prayers.isha, apiTimings.Isha),
    ishaIqama: monthlyIqamaValue(
      resolved.prayers.isha,
      normalizeTime(resolved.prayers.isha.adhan) ?? apiTimings.Isha,
    ),
    notes: "",
    isFriday: format(date, "EEEE") === "Friday",
  };
}

function mapDbRow(row: {
  id: string;
  date: Date;
  fajrAdhan: string | null;
  fajrIqama: string | null;
  sunrise: string | null;
  dhuhrAdhan: string | null;
  dhuhrIqama: string | null;
  asrAdhan: string | null;
  asrIqama: string | null;
  maghribAdhan: string | null;
  maghribIqama: string | null;
  ishaAdhan: string | null;
  ishaIqama: string | null;
  notes: string | null;
}): MonthlyDayRow {
  const dateKey = toRecordDateKey(row.date);
  const date = parseDateKey(dateKey);

  return {
    id: row.id,
    date: dateKey,
    dayName: format(date, "EEEE"),
    fajrAdhan: row.fajrAdhan ?? "",
    fajrIqama: row.fajrIqama ?? "",
    sunrise: row.sunrise ?? "",
    dhuhrAdhan: row.dhuhrAdhan ?? "",
    dhuhrIqama: row.dhuhrIqama ?? "",
    asrAdhan: row.asrAdhan ?? "",
    asrIqama: row.asrIqama ?? "",
    maghribAdhan: row.maghribAdhan ?? "",
    maghribIqama: row.maghribIqama ?? "",
    ishaAdhan: row.ishaAdhan ?? "",
    ishaIqama: row.ishaIqama ?? "",
    notes: row.notes ?? "",
    isFriday: format(date, "EEEE") === "Friday",
  };
}

export async function listMonthlyTimetable(month: number, year: number) {
  const rows = await db.monthlyTimetable.findMany({
    where: { month, year },
    orderBy: { date: "asc" },
  });

  return rows
    .map(mapDbRow)
    .filter((row) => {
      const [rowYear, rowMonth] = row.date.split("-").map(Number);
      return rowYear === year && rowMonth === month;
    });
}

export async function generateMonthlyTimetable(month: number, year: number) {
  const calendar = await fetchAlAdhanGregorianCalendar(month, year);
  const apiTimingsByDate = new Map(
    calendar.data.map((day) => [
      parseAlAdhanGregorianDate(day.date.gregorian.date),
      day.timings,
    ])
  );

  const dayCount = getGregorianMonthDayCount(month, year);
  const rows = await Promise.all(
    Array.from({ length: dayCount }, async (_, index) => {
      const day = index + 1;
      const dateKey = buildDateKey(year, month, day);
      const apiTimings = apiTimingsByDate.get(dateKey) ?? {
        Fajr: "",
        Sunrise: "",
        Dhuhr: "",
        Asr: "",
        Maghrib: "",
        Isha: "",
      };
      return buildMonthlyRowFromDailyPrayerTimes(dateKey, apiTimings);
    }),
  );

  return { month, year, rows };
}

function parsePublishedSetting(value: string | undefined) {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

async function setSettingValue(key: string, value: string) {
  await db.setting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export async function getMonthlyTimetablePublishState() {
  const settings = await getSettingsMap();
  const month = Number(settings[SETTING_KEYS.monthlyTimetableMonth]);
  const year = Number(settings[SETTING_KEYS.monthlyTimetableYear]);
  const hasMonthYear = Boolean(month && year);
  const rows =
    hasMonthYear ? await listMonthlyTimetable(month, year) : [];
  const hasData = rows.length > 0;
  const explicit = parsePublishedSetting(
    settings[SETTING_KEYS.monthlyTimetablePublished],
  );
  const published =
    explicit === false
      ? false
      : explicit === true || (hasData && explicit === null);

  return {
    published: published && hasData,
    month: hasMonthYear ? month : null,
    year: hasMonthYear ? year : null,
    hasData,
  };
}

export async function setMonthlyTimetableHomePublished(published: boolean) {
  await setSettingValue(
    SETTING_KEYS.monthlyTimetablePublished,
    String(published),
  );
}

export async function publishMonthlyTimetableToHomepage(
  month: number,
  year: number,
  rows: MonthlyDayRow[],
) {
  await saveMonthlyTimetable(month, year, rows);
  await setMonthlyTimetableHomePublished(true);
}

export async function unpublishMonthlyTimetableFromHomepage() {
  await setMonthlyTimetableHomePublished(false);
}

export async function getPublishedMonthlyTimetable() {
  const state = await getMonthlyTimetablePublishState();
  if (!state.published || !state.month || !state.year) {
    return null;
  }

  const rows = await listMonthlyTimetable(state.month, state.year);
  if (rows.length === 0) {
    return null;
  }

  return { month: state.month, year: state.year, rows };
}

export async function saveMonthlyTimetable(month: number, year: number, rows: MonthlyDayRow[]) {
  await db.$transaction(
    rows.map((row) =>
      db.monthlyTimetable.upsert({
        where: {
          month_year_date: {
            month,
            year,
            date: parseDateKey(row.date),
          },
        },
        create: {
          month,
          year,
          date: parseDateKey(row.date),
          fajrAdhan: row.fajrAdhan,
          fajrIqama: row.fajrIqama,
          sunrise: row.sunrise,
          dhuhrAdhan: row.dhuhrAdhan,
          dhuhrIqama: row.dhuhrIqama,
          asrAdhan: row.asrAdhan,
          asrIqama: row.asrIqama,
          maghribAdhan: row.maghribAdhan,
          maghribIqama: row.maghribIqama,
          ishaAdhan: row.ishaAdhan,
          ishaIqama: row.ishaIqama,
          notes: row.notes,
        },
        update: {
          fajrAdhan: row.fajrAdhan,
          fajrIqama: row.fajrIqama,
          sunrise: row.sunrise,
          dhuhrAdhan: row.dhuhrAdhan,
          dhuhrIqama: row.dhuhrIqama,
          asrAdhan: row.asrAdhan,
          asrIqama: row.asrIqama,
          maghribAdhan: row.maghribAdhan,
          maghribIqama: row.maghribIqama,
          ishaAdhan: row.ishaAdhan,
          ishaIqama: row.ishaIqama,
          notes: row.notes,
        },
      })
    )
  );

  await db.setting.upsert({
    where: { key: SETTING_KEYS.monthlyTimetableMonth },
    create: { key: SETTING_KEYS.monthlyTimetableMonth, value: String(month) },
    update: { value: String(month) },
  });
  await db.setting.upsert({
    where: { key: SETTING_KEYS.monthlyTimetableYear },
    create: { key: SETTING_KEYS.monthlyTimetableYear, value: String(year) },
    update: { value: String(year) },
  });

  return listMonthlyTimetable(month, year);
}

export { normalizeTime };

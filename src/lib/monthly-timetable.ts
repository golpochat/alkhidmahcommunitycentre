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
  getGregorianMonthDayCount,
  IQAMA_OFFSET_MINUTES,
  normalizeTime,
  parseAlAdhanGregorianDate,
  parseDateKey,
  toRecordDateKey,
  type PrayerSlot,
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
  return adhan ? addMinutesToTime(adhan, IQAMA_OFFSET_MINUTES) : "";
}

function monthlyAdhanValue(slot: PrayerSlot, apiFallback: string) {
  const display = formatAdhanDisplay(slot);
  if (display !== "—") return display;
  return normalizeTime(apiFallback) ?? "";
}

function monthlyIqamaValue(slot: PrayerSlot, adhanFallback: string) {
  const display = formatIqamaDisplay(slot);
  if (display !== "—") return display;
  return normalizeTime(slot.iqama) ?? defaultIqama(adhanFallback);
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

  return {
    date: dateKey,
    dayName: format(date, "EEEE"),
    fajrAdhan: monthlyAdhanValue(resolved.prayers.fajr, apiTimings.Fajr),
    fajrIqama: monthlyIqamaValue(
      resolved.prayers.fajr,
      normalizeTime(resolved.prayers.fajr.adhan) ?? apiTimings.Fajr,
    ),
    sunrise: normalizeTime(resolved.sunrise ?? apiTimings.Sunrise) ?? "",
    dhuhrAdhan: monthlyAdhanValue(
      resolved.prayers.dhuhr ?? { adhan: null, iqama: null, iqamaDisplay: null },
      apiTimings.Dhuhr,
    ),
    dhuhrIqama: monthlyIqamaValue(
      resolved.prayers.dhuhr ?? { adhan: null, iqama: null, iqamaDisplay: null },
      normalizeTime(resolved.prayers.dhuhr?.adhan) ?? apiTimings.Dhuhr,
    ),
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

export async function getPublishedMonthlyTimetable() {
  const settings = await getSettingsMap();
  const month = Number(settings[SETTING_KEYS.monthlyTimetableMonth]);
  const year = Number(settings[SETTING_KEYS.monthlyTimetableYear]);
  if (!month || !year) {
    return null;
  }
  const rows = await listMonthlyTimetable(month, year);
  if (rows.length === 0) {
    return null;
  }
  return { month, year, rows };
}

export { normalizeTime };

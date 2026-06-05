import "server-only";

import {
  eachDayOfInterval,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
} from "date-fns";
import { db } from "@/lib/db";
import { getPrayerTimesForDate } from "@/lib/prayer-times";
import {
  addMinutesToTime,
  IQAMA_OFFSET_MINUTES,
  normalizeTime,
  parseAlAdhanGregorianDate,
  type PrayerSlot,
} from "@/lib/prayer-times-pure";
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

function resolveMonthlyAdhan(
  slot: PrayerSlot | null | undefined,
  apiFallback: string | undefined
): string {
  return normalizeTime(slot?.adhan ?? apiFallback) ?? "";
}

function resolveMonthlyIqama(
  slot: PrayerSlot | null | undefined,
  adhan: string
): string {
  return normalizeTime(slot?.iqama) ?? defaultIqama(adhan);
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
  const date = parseISO(dateKey);
  const resolved = await getPrayerTimesForDate(dateKey);
  const fajrAdhan = resolveMonthlyAdhan(resolved.prayers.fajr, apiTimings.Fajr);
  const dhuhrAdhan = resolveMonthlyAdhan(resolved.prayers.dhuhr, apiTimings.Dhuhr);
  const asrAdhan = resolveMonthlyAdhan(resolved.prayers.asr, apiTimings.Asr);
  const maghribAdhan = resolveMonthlyAdhan(
    resolved.prayers.maghrib,
    apiTimings.Maghrib
  );
  const ishaAdhan = resolveMonthlyAdhan(resolved.prayers.isha, apiTimings.Isha);

  return {
    date: dateKey,
    dayName: format(date, "EEEE"),
    fajrAdhan,
    fajrIqama: resolveMonthlyIqama(resolved.prayers.fajr, fajrAdhan),
    sunrise: normalizeTime(resolved.sunrise ?? apiTimings.Sunrise) ?? "",
    dhuhrAdhan,
    dhuhrIqama: resolveMonthlyIqama(resolved.prayers.dhuhr, dhuhrAdhan),
    asrAdhan,
    asrIqama: resolveMonthlyIqama(resolved.prayers.asr, asrAdhan),
    maghribAdhan,
    maghribIqama: resolveMonthlyIqama(resolved.prayers.maghrib, maghribAdhan),
    ishaAdhan,
    ishaIqama: resolveMonthlyIqama(resolved.prayers.isha, ishaAdhan),
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
  return {
    id: row.id,
    date: format(row.date, "yyyy-MM-dd"),
    dayName: format(row.date, "EEEE"),
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
    isFriday: format(row.date, "EEEE") === "Friday",
  };
}

export async function listMonthlyTimetable(month: number, year: number) {
  const rows = await db.monthlyTimetable.findMany({
    where: { month, year },
    orderBy: { date: "asc" },
  });
  return rows.map(mapDbRow);
}

export async function generateMonthlyTimetable(month: number, year: number) {
  const calendar = await fetchAlAdhanGregorianCalendar(month, year);
  const apiTimingsByDate = new Map(
    calendar.data.map((day) => [
      parseAlAdhanGregorianDate(day.date.gregorian.date),
      day.timings,
    ])
  );

  const monthStart = startOfMonth(new Date(year, month - 1, 1));
  const monthEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const rows = await Promise.all(
    days.map(async (date) => {
      const dateKey = format(date, "yyyy-MM-dd");
      const apiTimings = apiTimingsByDate.get(dateKey) ?? {
        Fajr: "",
        Sunrise: "",
        Dhuhr: "",
        Asr: "",
        Maghrib: "",
        Isha: "",
      };
      return buildMonthlyRowFromDailyPrayerTimes(dateKey, apiTimings);
    })
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
            date: parseISO(row.date),
          },
        },
        create: {
          month,
          year,
          date: parseISO(row.date),
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

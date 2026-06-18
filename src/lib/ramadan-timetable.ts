import "server-only";

import { addDays, differenceInCalendarDays, format, getDay, parseISO } from "date-fns";
import { db } from "@/lib/db";
import {
  addMinutesToTime,
  type AlAdhanCalendarDay,
  normalizeTime,
  parseAlAdhanGregorianDate,
} from "@/lib/prayer-times-pure";
import { fetchAlAdhanHijriCalendar } from "@/lib/prayer-times-aladhan";
import {
  formatRamadanTime,
  normalizeRamadanRowTimes,
} from "@/lib/ramadan-format";
import { assertRamadanNotesWithinLimit } from "@/lib/ramadan-notes-html";
import type {
  RamadanSeasonInfo,
  UpcomingRamadanSeasonInfo,
} from "@/lib/ramadan-season-types";
import {
  EMPTY_RAMADAN_SETTINGS,
  normalizeRamadanQrSlotCount,
  normalizeRamadanStartDayOffset,
  RAMADAN_NOTES_MAX_LENGTH,
  type RamadanSettingsData,
} from "@/lib/ramadan-settings-types";
import { listRamadanPaymentQrs } from "@/lib/ramadan-payment-qr";
import { listActiveDonationCategories } from "@/lib/donation-categories";
import { getSettingsMap } from "@/lib/queries";
import { isHijriRamadanStorageYear } from "@/lib/ramadan-season-types";
import { getPrayerTimesForDate } from "@/lib/prayer-times";
import {
  getRamadanSeasonForHijriYear,
  getUpcomingRamadanSeason,
} from "@/lib/ramadan-seasons";
import { SETTING_KEYS } from "@/lib/settings";

export {
  RAMADAN_NOTES_MAX_LENGTH,
  RAMADAN_QR_MAX_SLOTS,
} from "@/lib/ramadan-settings-types";
export type { RamadanSettingsData } from "@/lib/ramadan-settings-types";

export interface RamadanDayRow {
  id?: string;
  date: string;
  dayName: string;
  hijriDay: number | null;
  hijriDate: string;
  suhoorEnd: string;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  iftar: string;
  isha: string;
  taraweeh: string;
  notes: string;
  isCommunityIftar: boolean;
  isOddNight: boolean;
  isLastTen: boolean;
  isFriday: boolean;
}

const RAMADAN_SETTING_PREFIX = "ramadan_season_";

function seasonSettingKey(kind: "start" | "end", year: number) {
  return `${RAMADAN_SETTING_PREFIX}${kind}_${year}`;
}

function formatHijriLabel(hijri: AlAdhanCalendarDay["date"]["hijri"]) {
  return `${hijri.day} ${hijri.month.en} ${hijri.year} AH`;
}

function ramadanFlags(hijriDay: number) {
  return {
    isOddNight: hijriDay % 2 === 1,
    isLastTen: hijriDay >= 21,
  };
}

function resolvePrayerAdhan(
  resolved: string | null | undefined,
  apiFallback: string | undefined
): string {
  return formatRamadanTime(resolved ?? normalizeTime(apiFallback) ?? "");
}

async function buildRamadanRowForDate(
  day: AlAdhanCalendarDay
): Promise<Omit<RamadanDayRow, "id">> {
  const dateKey = parseAlAdhanGregorianDate(day.date.gregorian.date);
  const timings = day.timings;
  const hijriDay = Number(day.date.hijri.day);
  const flags = ramadanFlags(hijriDay);
  const resolved = await getPrayerTimesForDate(dateKey);

  const fajr = resolvePrayerAdhan(
    resolved.prayers.fajr?.adhan,
    timings.Fajr
  );
  const maghrib = resolvePrayerAdhan(
    resolved.prayers.maghrib?.adhan,
    timings.Maghrib
  );

  return {
    date: dateKey,
    dayName: format(parseISO(dateKey), "EEEE"),
    hijriDay: hijriDay > 0 ? hijriDay : null,
    hijriDate: formatHijriLabel(day.date.hijri),
    suhoorEnd: fajr ? formatRamadanTime(addMinutesToTime(fajr, -10)) : "",
    fajr,
    sunrise: resolvePrayerAdhan(resolved.sunrise, timings.Sunrise),
    dhuhr: resolvePrayerAdhan(resolved.prayers.dhuhr?.adhan, timings.Dhuhr),
    asr: resolvePrayerAdhan(resolved.prayers.asr?.adhan, timings.Asr),
    maghrib,
    iftar: maghrib,
    isha: resolvePrayerAdhan(resolved.prayers.isha?.adhan, timings.Isha),
    taraweeh: resolvePrayerAdhan(resolved.prayers.isha?.adhan, timings.Isha),
    notes: "",
    isCommunityIftar: false,
    isOddNight: flags.isOddNight,
    isLastTen: flags.isLastTen,
    isFriday: getDay(parseISO(dateKey)) === 5,
  };
}

async function buildRamadanRowForGregorianDate(
  dateKey: string,
  hijriDay: number,
  hijriYear: number,
): Promise<Omit<RamadanDayRow, "id">> {
  const resolved = await getPrayerTimesForDate(dateKey);
  const fajr = formatRamadanTime(resolved.prayers.fajr?.adhan ?? "");
  const maghrib = formatRamadanTime(resolved.prayers.maghrib?.adhan ?? "");
  const flags = ramadanFlags(hijriDay);

  return {
    date: dateKey,
    dayName: format(parseISO(dateKey), "EEEE"),
    hijriDay,
    hijriDate: `${hijriDay} Ramadan ${hijriYear} AH`,
    suhoorEnd: fajr ? formatRamadanTime(addMinutesToTime(fajr, -10)) : "",
    fajr,
    sunrise: formatRamadanTime(resolved.sunrise ?? ""),
    dhuhr: formatRamadanTime(resolved.prayers.dhuhr?.adhan ?? ""),
    asr: formatRamadanTime(resolved.prayers.asr?.adhan ?? ""),
    maghrib,
    iftar: maghrib,
    isha: formatRamadanTime(resolved.prayers.isha?.adhan ?? ""),
    taraweeh: formatRamadanTime(resolved.prayers.isha?.adhan ?? ""),
    notes: "",
    isCommunityIftar: false,
    isOddNight: flags.isOddNight,
    isLastTen: flags.isLastTen,
    isFriday: getDay(parseISO(dateKey)) === 5,
  };
}

export function resolveUpcomingRamadanSeason(
  calculated: { hijriYear: number; startDate: string; endDate: string },
  settings: Pick<RamadanSettingsData, "startDayOffset" | "isThirtyDayMonth">,
): UpcomingRamadanSeasonInfo {
  const startDayOffset = normalizeRamadanStartDayOffset(settings.startDayOffset);
  const dayCount = settings.isThirtyDayMonth ? 30 : 29;
  const startDate = format(
    addDays(parseISO(calculated.startDate), startDayOffset),
    "yyyy-MM-dd",
  );
  const endDate = format(addDays(parseISO(startDate), dayCount - 1), "yyyy-MM-dd");

  return {
    hijriYear: calculated.hijriYear,
    calculatedStartDate: calculated.startDate,
    calculatedEndDate: calculated.endDate,
    startDate,
    endDate,
    startDayOffset,
    isThirtyDayMonth: settings.isThirtyDayMonth,
    dayCount,
  };
}

async function generateRamadanRows(
  season: UpcomingRamadanSeasonInfo,
): Promise<RamadanDayRow[]> {
  const calendar = await fetchAlAdhanHijriCalendar(season.hijriYear, 9);
  const calendarByDate = new Map(
    calendar.data.map((day) => [
      parseAlAdhanGregorianDate(day.date.gregorian.date),
      day,
    ]),
  );

  const rows = await Promise.all(
    Array.from({ length: season.dayCount }, async (_, index) => {
      const hijriDay = index + 1;
      const dateKey = format(
        addDays(parseISO(season.startDate), index),
        "yyyy-MM-dd",
      );
      const calendarDay = calendarByDate.get(dateKey);

      if (calendarDay) {
        const row = await buildRamadanRowForDate(calendarDay);
        const flags = ramadanFlags(hijriDay);
        return normalizeRamadanRowTimes({
          ...row,
          date: dateKey,
          dayName: format(parseISO(dateKey), "EEEE"),
          hijriDay,
          hijriDate: `${hijriDay} Ramadan ${season.hijriYear} AH`,
          isFriday: getDay(parseISO(dateKey)) === 5,
          isOddNight: flags.isOddNight,
          isLastTen: flags.isLastTen,
        });
      }

      return normalizeRamadanRowTimes(
        await buildRamadanRowForGregorianDate(
          dateKey,
          hijriDay,
          season.hijriYear,
        ),
      );
    }),
  );

  if (rows.length === 0) {
    throw new Error("No Ramadan days found for the upcoming season.");
  }

  return rows;
}

async function findRamadanDatesForGregorianYear(gregorianYear: number) {
  const candidateHijriYears = [
    gregorianYear - 579,
    gregorianYear - 578,
    gregorianYear - 580,
    gregorianYear - 577,
  ];

  for (const hijriYear of candidateHijriYears) {
    try {
      const calendar = await fetchAlAdhanHijriCalendar(hijriYear, 9);
      const daysInGregorianYear = calendar.data.filter((day) => {
        const dateKey = parseAlAdhanGregorianDate(day.date.gregorian.date);
        return parseISO(dateKey).getFullYear() === gregorianYear;
      });

      if (daysInGregorianYear.length < 20) {
        continue;
      }

      const startDate = parseAlAdhanGregorianDate(
        daysInGregorianYear[0].date.gregorian.date
      );
      const endDate = parseAlAdhanGregorianDate(
        daysInGregorianYear[daysInGregorianYear.length - 1].date.gregorian.date
      );

      return { startDate, endDate, hijriYear };
    } catch {
      continue;
    }
  }

  throw new Error(
    `Could not determine Ramadan dates for ${gregorianYear}. Set start/end dates manually.`
  );
}

export async function getCalculatedRamadanSeasonDates(year: number) {
  if (isHijriRamadanStorageYear(year)) {
    const season = await getRamadanSeasonForHijriYear(year);
    return {
      startDate: season.startDate,
      endDate: season.endDate,
      hijriYear: season.hijriYear,
    };
  }

  return findRamadanDatesForGregorianYear(year);
}

export async function getRamadanSeasonInfo(year: number): Promise<RamadanSeasonInfo> {
  const calculated = await getCalculatedRamadanSeasonDates(year);
  const settings = await getSettingsMap();
  const startOverride = settings[seasonSettingKey("start", year)]?.trim();
  const endOverride = settings[seasonSettingKey("end", year)]?.trim();
  const hasOverride = Boolean(startOverride && endOverride);

  return {
    hijriYear: isHijriRamadanStorageYear(year)
      ? year
      : calculated.hijriYear ?? null,
    startDate: hasOverride ? startOverride! : calculated.startDate,
    endDate: hasOverride ? endOverride! : calculated.endDate,
    calculatedStartDate: calculated.startDate,
    calculatedEndDate: calculated.endDate,
    isMoonSightingOverride: hasOverride,
  };
}

export async function getRamadanSeasonDates(year: number) {
  const info = await getRamadanSeasonInfo(year);
  return {
    startDate: info.startDate,
    endDate: info.endDate,
    hijriYear: info.hijriYear,
  };
}

function assertValidRamadanSeasonRange(startDate: string, endDate: string) {
  if (!startDate || !endDate) {
    throw new Error("Start and end dates are required.");
  }
  if (endDate < startDate) {
    throw new Error("Ramadan end date must be on or after the start date.");
  }

  const dayCount =
    differenceInCalendarDays(parseISO(endDate), parseISO(startDate)) + 1;
  if (dayCount < 27 || dayCount > 32) {
    throw new Error(
      "Ramadan should be between 27 and 32 days. Check the moon sighting dates."
    );
  }
}

export async function saveRamadanSeasonDates(
  year: number,
  startDate: string,
  endDate: string
) {
  assertValidRamadanSeasonRange(startDate, endDate);

  await db.setting.upsert({
    where: { key: seasonSettingKey("start", year) },
    create: { key: seasonSettingKey("start", year), value: startDate },
    update: { value: startDate },
  });
  await db.setting.upsert({
    where: { key: seasonSettingKey("end", year) },
    create: { key: seasonSettingKey("end", year), value: endDate },
    update: { value: endDate },
  });
}

export async function clearRamadanSeasonDateOverrides(year: number) {
  await db.setting.deleteMany({
    where: {
      key: {
        in: [seasonSettingKey("start", year), seasonSettingKey("end", year)],
      },
    },
  });
}

export async function saveRamadanMoonSightingDates(
  year: number,
  startDate: string,
  endDate: string
): Promise<RamadanSeasonInfo> {
  assertValidRamadanSeasonRange(startDate, endDate);

  const calculated = await getCalculatedRamadanSeasonDates(year);
  if (
    startDate === calculated.startDate &&
    endDate === calculated.endDate
  ) {
    await clearRamadanSeasonDateOverrides(year);
  } else {
    await saveRamadanSeasonDates(year, startDate, endDate);
  }

  return getRamadanSeasonInfo(year);
}

export async function resetRamadanMoonSightingDates(
  year: number
): Promise<RamadanSeasonInfo> {
  await clearRamadanSeasonDateOverrides(year);
  return getRamadanSeasonInfo(year);
}

function mapDbRow(row: {
  id: string;
  date: Date;
  hijriDay: number | null;
  hijriDate: string | null;
  suhoorEnd: string | null;
  fajr: string | null;
  sunrise: string | null;
  dhuhr: string | null;
  asr: string | null;
  maghrib: string | null;
  iftar: string | null;
  isha: string | null;
  taraweeh: string | null;
  notes: string | null;
  isCommunityIftar: boolean;
  isOddNight: boolean;
  isLastTen: boolean;
}): RamadanDayRow {
  const dateKey = format(row.date, "yyyy-MM-dd");
  const normalized = normalizeRamadanRowTimes({
    suhoorEnd: row.suhoorEnd ?? "",
    fajr: row.fajr ?? "",
    sunrise: row.sunrise ?? "",
    dhuhr: row.dhuhr ?? "",
    asr: row.asr ?? "",
    maghrib: row.maghrib ?? "",
    iftar: row.iftar ?? row.maghrib ?? "",
    isha: row.isha ?? "",
    taraweeh: row.taraweeh ?? "",
  });

  return {
    id: row.id,
    date: dateKey,
    dayName: format(row.date, "EEEE"),
    hijriDay: row.hijriDay,
    hijriDate: row.hijriDate ?? "",
    suhoorEnd: normalized.suhoorEnd ?? "",
    fajr: normalized.fajr ?? "",
    sunrise: normalized.sunrise ?? "",
    dhuhr: normalized.dhuhr ?? "",
    asr: normalized.asr ?? "",
    maghrib: normalized.maghrib ?? "",
    iftar: normalized.iftar ?? "",
    isha: normalized.isha ?? "",
    taraweeh: normalized.taraweeh ?? "",
    notes: row.notes ?? "",
    isCommunityIftar: row.isCommunityIftar,
    isOddNight: row.isOddNight,
    isLastTen: row.isLastTen,
    isFriday: getDay(row.date) === 5,
  };
}

export const RAMADAN_DAYS_COUNT = 30;

function buildThirtiethDayRow(last: RamadanDayRow): RamadanDayRow {
  const nextDate = format(addDays(parseISO(last.date), 1), "yyyy-MM-dd");
  const nextHijriDay = (last.hijriDay ?? RAMADAN_DAYS_COUNT - 1) + 1;
  const flags = ramadanFlags(nextHijriDay);

  return normalizeRamadanRowTimes({
    ...last,
    id: undefined,
    date: nextDate,
    dayName: format(parseISO(nextDate), "EEEE"),
    hijriDay: nextHijriDay,
    hijriDate: `${nextHijriDay} Ramadan`,
    isFriday: getDay(parseISO(nextDate)) === 5,
    isOddNight: flags.isOddNight,
    isLastTen: flags.isLastTen,
  });
}

export function ensureThirtyRamadanRows(rows: RamadanDayRow[]): RamadanDayRow[] {
  if (rows.length === 0) return rows;

  const next = [...rows];
  while (next.length < RAMADAN_DAYS_COUNT) {
    next.push(buildThirtiethDayRow(next[next.length - 1]));
  }

  return next.slice(0, RAMADAN_DAYS_COUNT);
}

export async function listRamadanTimetable(year: number) {
  const rows = await db.ramadanTimetable.findMany({
    where: { year },
    orderBy: { date: "asc" },
  });
  return ensureThirtyRamadanRows(rows.map(mapDbRow));
}

export async function generateRamadanTimetable(year: number) {
  const upcoming = await getUpcomingRamadanSeason();
  if (upcoming.hijriYear !== year) {
    throw new Error("Only the upcoming Ramadan season can be generated.");
  }

  const settings = await getRamadanSettings(year);
  const season = resolveUpcomingRamadanSeason(upcoming, settings);
  const rows = await generateRamadanRows(season);

  return {
    year,
    hijriYear: season.hijriYear,
    startDate: season.startDate,
    endDate: season.endDate,
    season,
    rows,
  };
}

export async function generateUpcomingRamadanTimetable() {
  const upcoming = await getUpcomingRamadanSeason();
  return generateRamadanTimetable(upcoming.hijriYear);
}

export async function getDefaultRamadanSettings(): Promise<RamadanSettingsData> {
  return { ...EMPTY_RAMADAN_SETTINGS };
}

function mergeRamadanSettings(
  defaults: RamadanSettingsData,
  saved: {
    notesMessage: string | null;
    qrSlotCount?: number | null;
    startDayOffset?: number | null;
    isThirtyDayMonth?: boolean | null;
  } | null,
): RamadanSettingsData {
  if (!saved) return defaults;

  return {
    notesMessage: saved.notesMessage?.trim()
      ? saved.notesMessage
      : defaults.notesMessage,
    qrSlotCount: normalizeRamadanQrSlotCount(saved.qrSlotCount),
    startDayOffset: normalizeRamadanStartDayOffset(saved.startDayOffset),
    isThirtyDayMonth: saved.isThirtyDayMonth === true,
  };
}

export async function getRamadanSettings(year: number): Promise<RamadanSettingsData> {
  const defaults = await getDefaultRamadanSettings();
  const saved = await db.ramadanSettings.findUnique({ where: { year } });
  return mergeRamadanSettings(defaults, saved);
}

export async function saveRamadanSettings(year: number, settings: Partial<RamadanSettingsData>) {
  const current = await getRamadanSettings(year);

  const next: RamadanSettingsData = {
    notesMessage:
      settings.notesMessage !== undefined
        ? assertRamadanNotesWithinLimit(settings.notesMessage)
        : current.notesMessage,
    qrSlotCount: normalizeRamadanQrSlotCount(
      settings.qrSlotCount ?? current.qrSlotCount,
    ),
    startDayOffset: normalizeRamadanStartDayOffset(
      settings.startDayOffset ?? current.startDayOffset,
    ),
    isThirtyDayMonth:
      settings.isThirtyDayMonth ?? current.isThirtyDayMonth,
  };

  await db.ramadanSettings.upsert({
    where: { year },
    create: {
      year,
      notesMessage: next.notesMessage || null,
      qrSlotCount: next.qrSlotCount,
      startDayOffset: next.startDayOffset,
      isThirtyDayMonth: next.isThirtyDayMonth,
    },
    update: {
      notesMessage: next.notesMessage || null,
      qrSlotCount: next.qrSlotCount,
      startDayOffset: next.startDayOffset,
      isThirtyDayMonth: next.isThirtyDayMonth,
    },
  });

  return next;
}

export async function getRamadanNotesMessage(year: number) {
  const settings = await getRamadanSettings(year);
  return settings.notesMessage;
}

export async function getUpcomingRamadanTimetablePayload() {
  const upcoming = await getUpcomingRamadanSeason();
  const year = upcoming.hijriYear;
  const settings = await getRamadanSettings(year);
  const season = resolveUpcomingRamadanSeason(upcoming, settings);
  const generated = await generateRamadanRows(season);
  const paymentQrs = await listRamadanPaymentQrs(year, settings.qrSlotCount);
  const categories = await listActiveDonationCategories();

  return {
    year,
    season,
    rows: generated,
    settings,
    paymentQrs,
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      donationUrl: category.donationUrl,
    })),
  };
}

export async function updateUpcomingRamadanConfig(
  patch: Partial<Pick<RamadanSettingsData, "startDayOffset" | "isThirtyDayMonth">>,
) {
  const upcoming = await getUpcomingRamadanSeason();
  const year = upcoming.hijriYear;
  const settings = await saveRamadanSettings(year, patch);
  const season = resolveUpcomingRamadanSeason(upcoming, settings);
  const rows = await generateRamadanRows(season);

  return {
    year,
    season,
    settings,
    rows,
  };
}

export async function getRamadanTimetablePayload(year: number) {
  const rows = await listRamadanTimetable(year);
  let season: RamadanSeasonInfo = {
    hijriYear: isHijriRamadanStorageYear(year) ? year : null,
    startDate: "",
    endDate: "",
    calculatedStartDate: "",
    calculatedEndDate: "",
    isMoonSightingOverride: false,
  };

  try {
    season = await getRamadanSeasonInfo(year);
  } catch {
    // Season dates unavailable until AlAdhan can be reached.
  }

  const settings = await getRamadanSettings(year);
  const paymentQrs = await listRamadanPaymentQrs(year, settings.qrSlotCount);
  const categories = await listActiveDonationCategories();

  return {
    year,
    season,
    rows,
    settings,
    paymentQrs,
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      donationUrl: category.donationUrl,
    })),
  };
}

export async function saveRamadanTimetable(
  year: number,
  rows: RamadanDayRow[],
  season?: { startDate: string; endDate: string },
  settings?: Partial<RamadanSettingsData>,
  options?: { resetMoonSightingDates?: boolean }
) {
  if (options?.resetMoonSightingDates) {
    await clearRamadanSeasonDateOverrides(year);
  } else if (season) {
    await saveRamadanMoonSightingDates(
      year,
      season.startDate,
      season.endDate
    );
  }

  await db.$transaction(
    rows.map((row) => {
      const normalized = normalizeRamadanRowTimes(row);
      return db.ramadanTimetable.upsert({
        where: {
          year_date: {
            year,
            date: parseISO(row.date),
          },
        },
        create: {
          year,
          date: parseISO(row.date),
          hijriDay: row.hijriDay,
          hijriDate: row.hijriDate,
          suhoorEnd: normalized.suhoorEnd,
          fajr: normalized.fajr,
          sunrise: normalized.sunrise,
          dhuhr: normalized.dhuhr,
          asr: normalized.asr,
          maghrib: normalized.maghrib,
          iftar: normalized.iftar || normalized.maghrib,
          isha: normalized.isha,
          taraweeh: normalized.taraweeh,
          notes: row.notes,
          isCommunityIftar: row.isCommunityIftar,
          isOddNight: row.isOddNight,
          isLastTen: row.isLastTen,
        },
        update: {
          hijriDay: row.hijriDay,
          hijriDate: row.hijriDate,
          suhoorEnd: normalized.suhoorEnd,
          fajr: normalized.fajr,
          sunrise: normalized.sunrise,
          dhuhr: normalized.dhuhr,
          asr: normalized.asr,
          maghrib: normalized.maghrib,
          iftar: normalized.iftar || normalized.maghrib,
          isha: normalized.isha,
          taraweeh: normalized.taraweeh,
          notes: row.notes,
          isCommunityIftar: row.isCommunityIftar,
          isOddNight: row.isOddNight,
          isLastTen: row.isLastTen,
        },
      });
    })
  );

  let savedSettings: RamadanSettingsData | undefined;
  if (settings !== undefined) {
    savedSettings = await saveRamadanSettings(year, settings);
  }

  await db.setting.upsert({
    where: { key: SETTING_KEYS.ramadanActiveYear },
    create: { key: SETTING_KEYS.ramadanActiveYear, value: String(year) },
    update: { value: String(year) },
  });

  return {
    rows: await listRamadanTimetable(year),
    settings: savedSettings ?? (settings !== undefined ? await getRamadanSettings(year) : undefined),
  };
}

export async function getActiveRamadanYear() {
  const settings = await getSettingsMap();
  const value = settings[SETTING_KEYS.ramadanActiveYear]?.trim();
  return value ? Number(value) : null;
}

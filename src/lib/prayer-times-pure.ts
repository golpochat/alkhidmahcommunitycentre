import { format, nextFriday, parseISO } from "date-fns";
import type { AlAdhanResponse } from "@/types";
import {
  buildDailyIqamaConfigFromOverride,
  defaultIqamaConfig,
  parseDailyIqamaConfig,
} from "@/lib/prayer-iqama";
import {
  defaultAdhanConfig,
  hasAdhanOverrides,
  parseDailyAdhanConfig,
} from "@/lib/prayer-adhan";

export type { DailyIqamaConfig, DailyPrayerKey, PrayerIqamaConfig, IqamaMode } from "@/lib/prayer-iqama";
export {
  defaultIqamaConfig,
  defaultIqamaConfigEntry,
  formatIqamaDisplay,
  getIntervalTextValue,
  FOLLOWS_MAGHRIB_LABEL,
  legacyIqamaFieldsFromConfig,
  parseIntervalMinutes,
} from "@/lib/prayer-iqama";

export const IQAMA_OFFSET_MINUTES = 15;

/** Default Jumu'ah times used when no override is saved (Fridays). */
export const DEFAULT_JUMUAH_TIMES = [
  { index: 1, adhan: "13:00", iqama: "13:15" },
  { index: 2, adhan: "14:00", iqama: "14:15" },
] as const;

export interface JumuahAdminSlot {
  index: number;
  adhan: string;
  iqama: string;
}

/** Default Eid prayer times when no override is saved. */
export const DEFAULT_EID_FITR_TIMES = [
  { index: 1, adhan: "07:30", iqama: "08:00" },
  { index: 2, adhan: "09:30", iqama: "10:00" },
] as const;

export const DEFAULT_EID_ADHA_TIMES = [
  { index: 1, adhan: "07:30", iqama: "08:00" },
  { index: 2, adhan: "09:30", iqama: "10:00" },
] as const;

export type EidType = "FITR" | "ADHA" | null;

export interface EidSlot {
  index: number;
  adhan: string | null;
  iqama: string | null;
}

/** Congregation time for Eid (stored in adhan + iqama in DB). */
export function getEidPrayerTime(slot: EidSlot) {
  return slot.iqama ?? slot.adhan;
}

export function eidSlotFromPrayerTime(index: number, time: string): EidSlot {
  return { index, adhan: time, iqama: time };
}

export interface PrayerSlot {
  adhan: string | null;
  iqama: string | null;
  iqamaDisplay: string | null;
}

export interface JumuahSlot {
  index: number;
  adhan: string | null;
  iqama: string | null;
}

export interface EidInfo {
  type: EidType;
  prayers: EidSlot[];
  /** Eid date (yyyy-MM-dd) when shown ahead of the day */
  date?: string;
  isUpcoming?: boolean;
}

export interface NextPrayer {
  type: "fard" | "jumuah" | "eid" | "sunrise";
  name: string;
  timeType: "adhan" | "iqama";
  time: string;
}

export interface PrayerTimesResponse {
  date: string;
  englishDate: string | null;
  hijriDate: string | null;
  hijriDateArabic: string | null;
  sunrise: string | null;
  isFriday: boolean;
  prayers: {
    fajr: PrayerSlot;
    dhuhr: PrayerSlot | null;
    asr: PrayerSlot;
    maghrib: PrayerSlot;
    isha: PrayerSlot;
  };
  jumuah: JumuahSlot[];
  /** Saved Jumuah times from admin (used every Friday). */
  configuredJumuah: JumuahSlot[];
  eid: EidInfo;
  nextPrayer: NextPrayer | null;
  /** True when live AlAdhan data could not be fetched. */
  degraded?: boolean;
  warning?: string;
}

export function getEidTitle(type: EidType) {
  if (type === "FITR") return "Eid-ul-Fitr Prayer Times";
  if (type === "ADHA") return "Eid-ul-Adha Prayer Times";
  return "";
}

export function getEidShortName(type: EidType) {
  if (type === "FITR") return "Eid-ul-Fitr";
  if (type === "ADHA") return "Eid-ul-Adha";
  return "";
}

export function formatLiveClock(now: Date = new Date()) {
  return now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function getCountdownToNextPrayer(
  nextPrayer: NextPrayer | null,
  now: Date = new Date()
) {
  if (!nextPrayer?.time) return null;

  const normalized = normalizeTime(nextPrayer.time);
  if (!normalized) return null;

  const [hours, minutes] = normalized.split(":").map(Number);
  const target = new Date(now);
  target.setHours(hours, minutes, 0, 0);

  let diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) {
    target.setDate(target.getDate() + 1);
    diffMs = target.getTime() - now.getTime();
  }

  return Math.max(0, Math.floor(diffMs / 1000));
}

export function formatCountdown(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatPrayerTime24h(time?: string | null) {
  const normalized = normalizeTime(time);
  if (!normalized) return "—";

  const [hours, minutes] = normalized.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return "—";

  return `${hours}:${String(minutes).padStart(2, "0")}`;
}

export function parseDateParam(dateParam?: string | null) {
  const dateKey = dateParam ?? toDateKey(new Date());
  return new Date(`${dateKey}T00:00:00.000Z`);
}

export function toDateKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

/** Calendar date key for `@db.Date` values stored in UTC. */
export function toRecordDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function isFriday(date: Date) {
  return date.getDay() === 5;
}

/** Date key used when saving Jumu'ah overrides (today if Friday, otherwise next Friday). */
export function getJumuahSaveDate(now: Date = new Date()): string {
  const today = parseISO(format(now, "yyyy-MM-dd"));
  return format(isFriday(today) ? today : nextFriday(today), "yyyy-MM-dd");
}

export function normalizeTime(value?: string | null) {
  if (!value) return null;
  return value.split(" ")[0].slice(0, 5);
}

export function formatPrayerTime12h(time?: string | null) {
  const normalized = normalizeTime(time);
  if (!normalized) return "—";

  const [hours, minutes] = normalized.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return "—";

  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
}

export function getEidPrayerLabel(index: number) {
  return `Eid prayer ${index}`;
}

export function getJumuahPrayerLabel(index: number) {
  return `Jumuah Prayer ${index}`;
}

export function formatJumuahOrdinal(index: number) {
  const suffix =
    index % 10 === 1 && index % 100 !== 11
      ? "st"
      : index % 10 === 2 && index % 100 !== 12
        ? "nd"
        : index % 10 === 3 && index % 100 !== 13
          ? "rd"
          : "th";

  return `${index}${suffix}`;
}

export function getJumuahOrdinalLabel(index: number) {
  return `${formatJumuahOrdinal(index)} Jumuah`;
}

export function formatJamaahLabel(index: number) {
  return `${formatJumuahOrdinal(index)} Jama'ah`;
}

export function isCombinedMaghribIsha(schedule: PrayerTimesResponse): boolean {
  const ishaAdhan = normalizeTime(schedule.prayers.isha.adhan);
  const ishaIqamah = normalizeTime(schedule.prayers.isha.iqama);
  if (!ishaAdhan || !ishaIqamah) return false;

  return parseTimeToMinutes(ishaIqamah) < parseTimeToMinutes(ishaAdhan);
}

export function formatNextPrayerCountdownLabel(nextPrayer: NextPrayer) {
  if (nextPrayer.type === "jumuah") {
    const match = nextPrayer.name.match(/(\d+)\s*$/);
    const index = match ? Number(match[1]) : 1;
    return `${getJumuahOrdinalLabel(index)} in`;
  }

  return `${nextPrayer.name} in`;
}

export function formatJumuahNoticeLine(jumuah: JumuahSlot[]) {
  return [...jumuah]
    .sort((a, b) => a.index - b.index)
    .map(
      (slot) =>
        `${getJumuahOrdinalLabel(slot.index)}: ${formatPrayerTime24h(slot.adhan)}`
    )
    .join(", ");
}

/** Dev preview: show the Friday Jumu'ah row on non-Fridays (homepage only). */
export function withJumuahTablePreview(schedule: PrayerTimesResponse): PrayerTimesResponse {
  if (schedule.isFriday && schedule.jumuah.length > 0) {
    return schedule;
  }

  const jumuah =
    schedule.configuredJumuah.length > 0 ? schedule.configuredJumuah : schedule.jumuah;

  if (jumuah.length === 0) {
    return schedule;
  }

  const friday = nextFriday(parseISO(schedule.date));
  const fridayKey = format(friday, "yyyy-MM-dd");

  const preview: PrayerTimesResponse = {
    ...schedule,
    date: fridayKey,
    englishDate: format(friday, "EEEE d MMMM yyyy"),
    isFriday: true,
    jumuah,
    prayers: {
      ...schedule.prayers,
      dhuhr: null,
    },
    nextPrayer: null,
  };

  preview.nextPrayer = findNextPrayer(preview);
  return preview;
}

export function mapJumuahOverrides(
  overrides: Array<{ index: number; adhan: string | null; iqama: string | null }>
): JumuahSlot[] {
  return overrides.map((item) => ({
    index: item.index,
    adhan: normalizeTime(item.adhan),
    iqama: normalizeTime(item.iqama),
  }));
}

export type OverrideRecord = {
  eidType: string | null;
  eidShowOnFrontend?: boolean;
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
  iqamaConfig?: unknown;
  adhanConfig?: unknown;
  eidFitrAdhan1: string | null;
  eidFitrIqama1: string | null;
  eidFitrAdhan2: string | null;
  eidFitrIqama2: string | null;
  eidAdhaAdhan1: string | null;
  eidAdhaIqama1: string | null;
  eidAdhaAdhan2: string | null;
  eidAdhaIqama2: string | null;
  jumuahOverrides?: Array<{ index: number; adhan: string | null; iqama: string | null }>;
  eidOverrides?: Array<{ index: number; adhan: string | null; iqama: string | null }>;
};

type DbPrayerTimesOverrideRecord = OverrideRecord & {
  id: string;
  date: Date;
  updatedAt: Date;
};

export type { DbPrayerTimesOverrideRecord };

export function parseTimeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function addMinutesToTime(time: string, minutes: number) {
  const total = parseTimeToMinutes(time) + minutes;
  const normalized = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function buildSlot(
  adhan?: string | null,
  iqama?: string | null,
  deriveIqama = true
): PrayerSlot {
  const normalizedAdhan = normalizeTime(adhan);
  const normalizedIqama = normalizeTime(iqama);
  const resolvedIqama =
    normalizedIqama ??
    (deriveIqama && normalizedAdhan
      ? addMinutesToTime(normalizedAdhan, IQAMA_OFFSET_MINUTES)
      : null);

  return {
    adhan: normalizedAdhan,
    iqama: resolvedIqama,
    iqamaDisplay: resolvedIqama,
  };
}

export interface AlAdhanCalendarDay {
  timings: AlAdhanResponse["data"]["timings"];
  date: AlAdhanResponse["data"]["date"];
}

export interface AlAdhanCalendarResponse {
  code: number;
  status: string;
  data: AlAdhanCalendarDay[];
}

/** AlAdhan gregorian dates use DD-MM-YYYY. */
export function parseAlAdhanGregorianDate(gregorianDate: string) {
  const [day, month, year] = gregorianDate.split("-");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function formatHijriMonthEnglish(month: string) {
  return month.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function buildScheduleDates(dateKey: string, hijri: AlAdhanResponse["data"]["date"]["hijri"]) {
  const month = formatHijriMonthEnglish(hijri.month.en);

  return {
    englishDate: format(parseISO(dateKey), "EEEE d MMMM yyyy"),
    hijriDate: `${hijri.day} ${month} ${hijri.year}`,
    hijriDateArabic: `${hijri.day} ${hijri.month.ar} ${hijri.year} هـ`,
  };
}

function buildEidSlots(
  adhan1?: string | null,
  iqama1?: string | null,
  adhan2?: string | null,
  iqama2?: string | null
): EidSlot[] {
  const slots: EidSlot[] = [];

  if (adhan1 || iqama1) {
    slots.push({ index: 1, ...buildSlot(adhan1, iqama1) });
  }
  if (adhan2 || iqama2) {
    slots.push({ index: 2, ...buildSlot(adhan2, iqama2) });
  }

  return slots;
}

export function hasOverrideData(override: OverrideRecord | null | undefined) {
  if (!override) return false;
  if (override.eidType) return true;
  if (override.jumuahOverrides?.length) return true;
  if (override.eidOverrides?.length) return true;

  return [
    override.fajrAdhan,
    override.fajrIqama,
    override.dhuhrAdhan,
    override.dhuhrIqama,
    override.asrAdhan,
    override.asrIqama,
    override.maghribAdhan,
    override.maghribIqama,
    override.ishaAdhan,
    override.ishaIqama,
    override.eidFitrAdhan1,
    override.eidFitrIqama1,
    override.eidFitrAdhan2,
    override.eidFitrIqama2,
    override.eidAdhaAdhan1,
    override.eidAdhaIqama1,
    override.eidAdhaAdhan2,
    override.eidAdhaIqama2,
  ].some(Boolean);
}

export function hasDailyOverrideData(override: OverrideRecord | null | undefined) {
  if (!override) return false;
  if (override.jumuahOverrides?.length) return true;
  if (parseDailyIqamaConfig(override.iqamaConfig)) return true;

  const adhanConfig = parseDailyAdhanConfig(override.adhanConfig);
  if (adhanConfig && hasAdhanOverrides(adhanConfig)) return true;

  return [
    override.fajrAdhan,
    override.fajrIqama,
    override.dhuhrAdhan,
    override.dhuhrIqama,
    override.asrAdhan,
    override.asrIqama,
    override.maghribAdhan,
    override.maghribIqama,
    override.ishaAdhan,
    override.ishaIqama,
  ].some(Boolean);
}

interface ScheduleEntry {
  type: "fard" | "jumuah" | "eid" | "sunrise";
  name: string;
  timeType: "adhan" | "iqama";
  time: string;
  minutes: number;
}

function pushScheduleSlot(
  entries: ScheduleEntry[],
  type: ScheduleEntry["type"],
  name: string,
  slot: PrayerSlot | JumuahSlot | null | undefined
) {
  if (!slot) return;

  const time = slot.adhan ?? slot.iqama;
  if (!time) return;

  entries.push({
    type,
    name,
    timeType: slot.adhan ? "adhan" : "iqama",
    time,
    minutes: parseTimeToMinutes(time),
  });
}

function buildScheduleEntries(response: PrayerTimesResponse): ScheduleEntry[] {
  const entries: ScheduleEntry[] = [];

  pushScheduleSlot(entries, "fard", "Fajr", response.prayers.fajr);

  if (response.sunrise) {
    entries.push({
      type: "sunrise",
      name: "Sunrise",
      timeType: "adhan",
      time: response.sunrise,
      minutes: parseTimeToMinutes(response.sunrise),
    });
  }

  if (!response.isFriday || response.jumuah.length === 0) {
    pushScheduleSlot(entries, "fard", "Dhuhr", response.prayers.dhuhr);
  }

  pushScheduleSlot(entries, "fard", "Asr", response.prayers.asr);
  pushScheduleSlot(entries, "fard", "Maghrib", response.prayers.maghrib);
  pushScheduleSlot(entries, "fard", "Isha", response.prayers.isha);

  for (const jumuah of response.jumuah) {
    if (!jumuah.adhan) continue;

    entries.push({
      type: "jumuah",
      name: getJumuahPrayerLabel(jumuah.index),
      timeType: "adhan",
      time: jumuah.adhan,
      minutes: parseTimeToMinutes(jumuah.adhan),
    });
  }

  if (response.eid.type === "FITR") {
    for (const eid of response.eid.prayers) {
      pushScheduleSlot(entries, "eid", `Eid-ul-Fitr ${eid.index}`, eid);
    }
  }

  if (response.eid.type === "ADHA") {
    for (const eid of response.eid.prayers) {
      pushScheduleSlot(entries, "eid", `Eid-ul-Adha ${eid.index}`, eid);
    }
  }

  return entries.sort((a, b) => a.minutes - b.minutes);
}

export function findNextPrayer(
  response: PrayerTimesResponse,
  now: Date = new Date()
): NextPrayer | null {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const entries = buildScheduleEntries(response);
  const upcoming = entries.find((entry) => entry.minutes > currentMinutes);

  if (upcoming) {
    return {
      type: upcoming.type,
      name: upcoming.name,
      timeType: upcoming.timeType,
      time: upcoming.time,
    };
  }

  const first = entries[0];
  if (!first) return null;

  return {
    type: first.type,
    name: first.name,
    timeType: first.timeType,
    time: first.time,
  };
}

export function defaultJumuahSlots(): JumuahSlot[] {
  return DEFAULT_JUMUAH_TIMES.map((item) => ({
    index: item.index,
    adhan: item.adhan,
    iqama: item.iqama,
  }));
}

function defaultEidSlots(type: Exclude<EidType, null>): EidSlot[] {
  const source = type === "FITR" ? DEFAULT_EID_FITR_TIMES : DEFAULT_EID_ADHA_TIMES;
  return source.map((item) => eidSlotFromPrayerTime(item.index, item.iqama));
}

function buildEidSlotsFromRelation(
  eidOverrides?: Array<{ index: number; adhan: string | null; iqama: string | null }>
): EidSlot[] {
  if (!eidOverrides?.length) return [];

  return eidOverrides
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((item) => ({
      index: item.index,
      ...buildSlot(item.adhan, item.iqama, false),
    }));
}

function mergeEidSlots(
  type: Exclude<EidType, null>,
  override: OverrideRecord | null | undefined
): EidSlot[] {
  const relationSlots = buildEidSlotsFromRelation(override?.eidOverrides);
  if (relationSlots.length > 0) return relationSlots;

  const defaults = defaultEidSlots(type);

  if (!override) return defaults;

  const overrideSlots =
    type === "FITR"
      ? buildEidSlots(
          override.eidFitrAdhan1,
          override.eidFitrIqama1,
          override.eidFitrAdhan2,
          override.eidFitrIqama2
        )
      : buildEidSlots(
          override.eidAdhaAdhan1,
          override.eidAdhaIqama1,
          override.eidAdhaAdhan2,
          override.eidAdhaIqama2
        );

  if (overrideSlots.length === 0) return defaults;

  return overrideSlots;
}

export function isEidVisibleForToday(eidDate: Date, today: Date = parseDateParam()) {
  return toRecordDateKey(today) <= toRecordDateKey(eidDate);
}

export function defaultJumuahAdminSlots(): JumuahAdminSlot[] {
  return DEFAULT_JUMUAH_TIMES.map((item) => ({
    index: item.index,
    adhan: item.adhan,
    iqama: item.iqama ?? "",
  }));
}

export function jumuahSlotsFromRecord(record: {
  jumuah?: Array<{ index: number; adhan: string | null; iqama: string | null }>;
} | null): JumuahAdminSlot[] {
  if (!record?.jumuah?.length) {
    return defaultJumuahAdminSlots();
  }

  return record.jumuah.map((item) => ({
    index: item.index,
    adhan: item.adhan || "",
    iqama: item.iqama || "",
  }));
}

export function buildEidInfoFromRecord(
  record: OverrideRecord & { date?: Date | string },
  options?: { isUpcoming?: boolean }
): EidInfo {
  const eidType = record.eidType as EidType;
  if (!eidType) {
    return { type: null, prayers: [] };
  }

  const dateKey =
    record.date instanceof Date
      ? toRecordDateKey(record.date)
      : typeof record.date === "string"
        ? record.date
        : undefined;

  return {
    type: eidType,
    prayers: mergeEidSlots(eidType, record),
    date: dateKey,
    isUpcoming: options?.isUpcoming,
  };
}

export function getActiveJumuahIndex(
  jumuah: JumuahSlot[],
  now: Date = new Date(),
  asrAdhan?: string | null
): number | null {
  if (jumuah.length === 0) return null;

  const sorted = [...jumuah].sort((a, b) => a.index - b.index);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (asrAdhan) {
    const asrMinutes = parseTimeToMinutes(asrAdhan);
    if (currentMinutes >= asrMinutes) {
      return null;
    }
  }

  for (const slot of sorted) {
    if (!slot.adhan) continue;

    if (parseTimeToMinutes(slot.adhan) > currentMinutes) {
      return slot.index;
    }
  }

  return sorted[sorted.length - 1].index;
}

export function buildAdminFormDefaults(
  defaults: PrayerTimesResponse,
  eidType: EidType = null,
  eidPrayers: Array<{ index: number; time: string }> = []
) {
  const defaultEidPrayers =
    eidPrayers.length > 0
      ? eidPrayers
      : eidType === "FITR"
        ? DEFAULT_EID_FITR_TIMES.map((item) => ({
            index: item.index,
            time: item.iqama,
          }))
        : eidType === "ADHA"
          ? DEFAULT_EID_ADHA_TIMES.map((item) => ({
              index: item.index,
              time: item.iqama,
            }))
          : [];

  return {
    date: defaults.date,
    eidType,
    eidShowOnFrontend: false,
    eidPrayers: defaultEidPrayers,
    iqamaConfig: defaultIqamaConfig(),
    adhanConfig: defaultAdhanConfig(),
    fajrIqama: defaults.prayers.fajr.iqama || "",
    dhuhrIqama: defaults.prayers.dhuhr?.iqama || "",
    asrIqama: defaults.prayers.asr.iqama || "",
    maghribIqama: defaults.prayers.maghrib.iqama || "",
    ishaIqama: defaults.prayers.isha.iqama || "",
    jumuah: defaults.isFriday
      ? defaults.jumuah.map((item) => ({
          index: item.index,
          adhan: item.adhan || "",
          iqama: item.iqama || "",
        }))
      : [],
  };
}

function eidPrayersFromOverride(override: {
  eidType: string | null;
  eidOverrides?: Array<{ index: number; adhan: string | null; iqama: string | null }>;
  eidFitrAdhan1: string | null;
  eidFitrIqama1: string | null;
  eidFitrAdhan2: string | null;
  eidFitrIqama2: string | null;
  eidAdhaAdhan1: string | null;
  eidAdhaIqama1: string | null;
  eidAdhaAdhan2: string | null;
  eidAdhaIqama2: string | null;
}): Array<{ index: number; time: string }> {
  const type = override.eidType as EidType;
  if (!type) return [];

  const slots = mergeEidSlots(type, override as OverrideRecord);
  return slots.map((slot) => ({
    index: slot.index,
    time: getEidPrayerTime(slot) || "",
  }));
}

export function serializeOverride(override: {
  id: string;
  date: Date;
  eidType: string | null;
  eidShowOnFrontend?: boolean;
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
  iqamaConfig?: unknown;
  adhanConfig?: unknown;
  eidFitrAdhan1: string | null;
  eidFitrIqama1: string | null;
  eidFitrAdhan2: string | null;
  eidFitrIqama2: string | null;
  eidAdhaAdhan1: string | null;
  eidAdhaIqama1: string | null;
  eidAdhaAdhan2: string | null;
  eidAdhaIqama2: string | null;
  jumuahOverrides?: Array<{
    id?: string;
    index: number;
    adhan: string | null;
    iqama: string | null;
  }>;
  eidOverrides?: Array<{
    id?: string;
    index: number;
    adhan: string | null;
    iqama: string | null;
  }>;
}) {
  return {
    id: override.id,
    date: format(override.date, "yyyy-MM-dd"),
    eidType: override.eidType,
    eidShowOnFrontend: override.eidShowOnFrontend ?? false,
    iqamaConfig: buildDailyIqamaConfigFromOverride(override),
    adhanConfig: parseDailyAdhanConfig(override.adhanConfig) ?? undefined,
    fajrAdhan: override.fajrAdhan,
    fajrIqama: override.fajrIqama,
    dhuhrAdhan: override.dhuhrAdhan,
    dhuhrIqama: override.dhuhrIqama,
    asrAdhan: override.asrAdhan,
    asrIqama: override.asrIqama,
    maghribAdhan: override.maghribAdhan,
    maghribIqama: override.maghribIqama,
    ishaAdhan: override.ishaAdhan,
    ishaIqama: override.ishaIqama,
    eidFitrAdhan1: override.eidFitrAdhan1,
    eidFitrIqama1: override.eidFitrIqama1,
    eidFitrAdhan2: override.eidFitrAdhan2,
    eidFitrIqama2: override.eidFitrIqama2,
    eidAdhaAdhan1: override.eidAdhaAdhan1,
    eidAdhaIqama1: override.eidAdhaIqama1,
    eidAdhaAdhan2: override.eidAdhaAdhan2,
    eidAdhaIqama2: override.eidAdhaIqama2,
    eidPrayers: eidPrayersFromOverride(override),
    jumuah: (override.jumuahOverrides ?? []).map((item) => ({
      id: item.id ?? `${item.index}`,
      index: item.index,
      adhan: item.adhan,
      iqama: item.iqama,
    })),
  };
}

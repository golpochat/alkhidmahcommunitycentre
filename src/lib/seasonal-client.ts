import {
  findNextPrayer,
  formatNextPrayerCountdownLabel,
  getCountdownToNextPrayer,
  getDisplayMinutes,
  isFriday,
  normalizeTime,
  type JumuahSlot,
  type NextPrayer,
  type PrayerTimesResponse,
} from "@/lib/prayer-times-pure";
import type { SeasonalCountdown, SeasonalFlags } from "@/lib/seasonal-types";
import type { SerializedDisplayNotice } from "@/lib/display-types";
import { filterActiveDisplayNotices } from "@/lib/display-notices";

const JUMUAH_ADHAN_EARLIEST_MINUTES = 6 * 60;
const JUMUAH_ADHAN_LATEST_MINUTES = 17 * 60;

function parseTimeMinutes(time: string | null | undefined): number | null {
  const normalized = normalizeTime(time);
  if (!normalized) return null;

  const [hours, minutes] = normalized.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  return hours * 60 + minutes;
}

function countdownToTime(
  time: string | null | undefined,
  label: string,
  now = new Date()
): SeasonalCountdown | null {
  const normalized = normalizeTime(time);
  if (!normalized) return null;

  const nextPrayer: NextPrayer = {
    type: "fard",
    name: label,
    timeType: "adhan",
    time: normalized,
  };

  const seconds = getCountdownToNextPrayer(nextPrayer, now);
  if (seconds === null) return null;

  return { label, seconds };
}

export function isValidJumuahSlot(slot: JumuahSlot): boolean {
  if (!normalizeTime(slot.iqama)) return false;

  const adhanMinutes = parseTimeMinutes(slot.adhan);
  if (adhanMinutes === null) return false;

  return (
    adhanMinutes >= JUMUAH_ADHAN_EARLIEST_MINUTES &&
    adhanMinutes <= JUMUAH_ADHAN_LATEST_MINUTES
  );
}

export function filterValidJumuahSlots(schedule: PrayerTimesResponse): JumuahSlot[] {
  return schedule.jumuah
    .filter(isValidJumuahSlot)
    .sort((a, b) => a.index - b.index);
}

export function getLastJumuahIqamah(schedule: PrayerTimesResponse): string | null {
  const slots = filterValidJumuahSlots(schedule);
  if (!slots.length) return null;

  return normalizeTime(slots[slots.length - 1].iqama);
}

export function getFirstJumuahIqamah(schedule: PrayerTimesResponse): string | null {
  const slots = filterValidJumuahSlots(schedule);
  if (!slots.length) return null;

  return normalizeTime(slots[0].iqama);
}

export function isBeforeLastJumuah(
  schedule: PrayerTimesResponse,
  now = new Date()
): boolean {
  if (!isFriday(now)) return false;

  const lastMinutes = parseTimeMinutes(getLastJumuahIqamah(schedule));
  if (lastMinutes === null) return false;

  const nowMinutes = getDisplayMinutes(now);
  return nowMinutes < lastMinutes;
}

export function shouldShowJumuahCountdown(
  schedule: PrayerTimesResponse,
  now = new Date()
): boolean {
  if (!schedule.isFriday || !isFriday(now)) return false;

  const slots = filterValidJumuahSlots(schedule);
  if (!slots.length) return false;

  const nowMinutes = getDisplayMinutes(now);
  const lastMinutes = parseTimeMinutes(getLastJumuahIqamah(schedule));
  if (lastMinutes === null) return false;

  if (nowMinutes >= lastMinutes) return false;

  return true;
}

export function getIftarCountdown(
  schedule: PrayerTimesResponse,
  now = new Date()
): SeasonalCountdown | null {
  const maghrib = schedule.prayers.maghrib.adhan ?? schedule.prayers.maghrib.iqama;
  return countdownToTime(maghrib, "Iftar in", now);
}

export function getSuhoorCountdown(
  schedule: PrayerTimesResponse,
  now = new Date()
): SeasonalCountdown | null {
  const fajr = schedule.prayers.fajr.adhan ?? schedule.prayers.fajr.iqama;
  return countdownToTime(fajr, "Suhoor ends in", now);
}

export function getRamadanActiveCountdown(
  schedule: PrayerTimesResponse,
  now = new Date()
): SeasonalCountdown | null {
  const suhoor = getSuhoorCountdown(schedule, now);
  const iftar = getIftarCountdown(schedule, now);

  if (!suhoor && !iftar) return null;
  if (!suhoor) return iftar;
  if (!iftar) return suhoor;

  return suhoor.seconds <= iftar.seconds ? suhoor : iftar;
}

export function getJumuahCountdown(
  schedule: PrayerTimesResponse,
  now = new Date()
): SeasonalCountdown | null {
  if (!shouldShowJumuahCountdown(schedule, now)) return null;

  const slots = filterValidJumuahSlots(schedule);
  const nowMinutes = getDisplayMinutes(now);

  for (const slot of slots) {
    const iqamaMinutes = parseTimeMinutes(slot.iqama);
    if (iqamaMinutes !== null && iqamaMinutes > nowMinutes) {
      return countdownToTime(slot.iqama, "Jumu'ah in", now);
    }
  }

  return null;
}

export function isAfterIsha(
  schedule: PrayerTimesResponse,
  now = new Date()
): boolean {
  const ishaTime =
    schedule.prayers.isha.iqama ??
    schedule.prayers.isha.adhan ??
    schedule.prayers.isha.iqamaDisplay;

  const fajrTime =
    schedule.prayers.fajr.adhan ?? schedule.prayers.fajr.iqama;

  const isha = normalizeTime(ishaTime);
  const fajr = normalizeTime(fajrTime);
  if (!isha || !fajr) return false;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const ishaMinutes = parseTimeMinutes(isha);
  const fajrMinutes = parseTimeMinutes(fajr);
  if (ishaMinutes === null || fajrMinutes === null) return false;

  if (ishaMinutes <= fajrMinutes) {
    return nowMinutes >= ishaMinutes || nowMinutes < fajrMinutes;
  }

  return nowMinutes >= ishaMinutes;
}

export type DisplayCountdownState =
  | { type: "emergency"; title: string; message: string }
  | { type: "seasonal"; countdown: SeasonalCountdown; totalSeconds: number }
  | { type: "prayer"; label: string; seconds: number }
  | { type: "none" };

export function resolveDisplayCountdown(
  schedule: PrayerTimesResponse,
  seasonal: SeasonalFlags,
  emergencyNotices: SerializedDisplayNotice[],
  now = new Date()
): DisplayCountdownState {
  const emergency = filterActiveDisplayNotices(emergencyNotices, now).find(
    (notice) => notice.priority === "high",
  );
  if (emergency) {
    return {
      type: "emergency",
      title: emergency.title,
      message: emergency.message,
    };
  }

  if (seasonal.isRamadan) {
    const ramadan = getRamadanActiveCountdown(schedule, now);
    if (ramadan) {
      return {
        type: "seasonal",
        countdown: ramadan,
        totalSeconds: 86_400,
      };
    }
  }

  if (shouldShowJumuahCountdown(schedule, now)) {
    const jumuah = getJumuahCountdown(schedule, now);
    if (jumuah) {
      return {
        type: "seasonal",
        countdown: jumuah,
        totalSeconds: 7200,
      };
    }
  }

  const nextPrayer = findNextPrayer(schedule, now);
  if (!nextPrayer) return { type: "none" };

  const seconds = getCountdownToNextPrayer(nextPrayer, now, schedule);
  if (seconds === null) return { type: "none" };

  return {
    type: "prayer",
    label: formatNextPrayerCountdownLabel(nextPrayer),
    seconds,
  };
}

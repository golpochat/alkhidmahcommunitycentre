import "server-only";

import { differenceInCalendarDays, parseISO } from "date-fns";
import { getRamadanSeasonSelectOptions } from "@/lib/ramadan-seasons";
import {
  isFriday,
  parseDateParam,
  toDateKey,
  type PrayerTimesResponse,
} from "@/lib/prayer-times-pure";
import type { SeasonalCountdown, SeasonalFlags } from "@/lib/seasonal-types";

export type { SeasonalCountdown, SeasonalFlags } from "@/lib/seasonal-types";
export {
  filterValidJumuahSlots,
  getFirstJumuahIqamah,
  getIftarCountdown,
  getJumuahCountdown,
  getLastJumuahIqamah,
  getRamadanActiveCountdown,
  getSuhoorCountdown,
  isAfterIsha,
  isBeforeLastJumuah,
  isValidJumuahSlot,
  resolveDisplayCountdown,
  shouldShowJumuahCountdown,
} from "@/lib/seasonal-client";
export type { DisplayCountdownState } from "@/lib/seasonal-client";

async function getCurrentRamadanSeason(referenceDate = new Date()) {
  const options = await getRamadanSeasonSelectOptions(referenceDate);
  const current = options.find((option) => option.role === "current");
  return current ?? null;
}

export async function isRamadan(referenceDate = new Date()): Promise<boolean> {
  const season = await getCurrentRamadanSeason(referenceDate);
  if (!season) return false;

  const todayKey = toDateKey(referenceDate);
  return season.startDate <= todayKey && todayKey <= season.endDate;
}

export function isEid(schedule: PrayerTimesResponse): boolean {
  return Boolean(schedule.eid?.type);
}

export function isJumuah(referenceDate = new Date()): boolean {
  return isFriday(referenceDate);
}

export async function getRamadanCountdown(
  referenceDate = new Date()
): Promise<SeasonalCountdown | null> {
  const options = await getRamadanSeasonSelectOptions(referenceDate);
  const next = options.find((option) => option.role === "next");
  if (!next) return null;

  const todayKey = toDateKey(referenceDate);
  if (todayKey >= next.startDate) return null;

  const days = differenceInCalendarDays(parseISO(next.startDate), referenceDate);
  return {
    label: "Ramadan begins in",
    seconds: Math.max(0, days * 86_400),
  };
}

export async function getSeasonalFlags(
  schedule: PrayerTimesResponse,
  referenceDate = new Date()
): Promise<SeasonalFlags> {
  const ramadanActive = await isRamadan(referenceDate);
  const season = ramadanActive ? await getCurrentRamadanSeason(referenceDate) : null;

  let ramadanDay: number | undefined;
  let ramadanDaysRemaining: number | undefined;

  if (season && ramadanActive) {
    const todayKey = toDateKey(referenceDate);
    ramadanDay =
      differenceInCalendarDays(parseISO(todayKey), parseISO(season.startDate)) + 1;
    ramadanDaysRemaining = differenceInCalendarDays(
      parseISO(season.endDate),
      parseISO(todayKey)
    );
  }

  return {
    isRamadan: ramadanActive,
    isEid: isEid(schedule),
    isJumuah: isJumuah(referenceDate),
    ramadanDay,
    ramadanDaysRemaining,
  };
}

export function parseDateParamSafe() {
  return parseDateParam();
}

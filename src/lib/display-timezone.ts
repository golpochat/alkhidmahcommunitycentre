import { getDisplayMinutes, normalizeTime, parseTimeToMinutes, type PrayerTimesResponse } from "@/lib/prayer-times-pure";
import { DateTime } from "luxon";

export { DISPLAY_TIMEZONE } from "@/lib/prayer-times-pure";

export function getDisplayDateTime(now: Date = new Date()): DateTime {
  return DateTime.fromJSDate(now, { zone: "Europe/Dublin" });
}

export function isAfterMaghrib(
  schedule: PrayerTimesResponse,
  now: Date = new Date()
): boolean {
  const maghrib = normalizeTime(schedule.prayers.maghrib.adhan);
  if (!maghrib) return false;
  return getDisplayMinutes(now) >= parseTimeToMinutes(maghrib);
}

export function resolveDisplayCalendarDates(
  schedule: PrayerTimesResponse,
  now: Date | null
): { englishDate: string | null; hijriDate: string | null } {
  if (!now || !isAfterMaghrib(schedule, now) || !schedule.tomorrow) {
    return {
      englishDate: schedule.englishDate,
      hijriDate: schedule.hijriDate,
    };
  }

  return {
    englishDate: schedule.tomorrow.englishDate ?? schedule.englishDate,
    hijriDate: schedule.tomorrow.hijriDate ?? schedule.hijriDate,
  };
}

import { parseISO } from "date-fns";
import type { PrayerTimesResponse } from "@/lib/prayer-times-client";

/** Stable time for SSR and pre-hydration render (noon on the schedule date). */
export function getDisplayEffectiveNow(
  schedule: PrayerTimesResponse,
  now: Date | null | undefined
): Date {
  if (now) return now;
  return parseISO(`${schedule.date}T12:00:00`);
}

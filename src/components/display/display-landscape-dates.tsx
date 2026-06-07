"use client";

import { resolveDisplayCalendarDates } from "@/lib/display-timezone";
import type { PrayerTimesResponse } from "@/lib/prayer-times-client";

interface DisplayLandscapeDatesProps {
  schedule: PrayerTimesResponse;
  now: Date | null;
}

export function DisplayLandscapeDates({
  schedule,
  now,
}: DisplayLandscapeDatesProps) {
  const dates = resolveDisplayCalendarDates(schedule, now);

  return (
    <div className="display-top-bar-dates-right">
      {dates.hijriDate && (
        <p className="display-clock-hijri">{dates.hijriDate}</p>
      )}
      {dates.englishDate && (
        <p className="display-clock-english">{dates.englishDate}</p>
      )}
    </div>
  );
}

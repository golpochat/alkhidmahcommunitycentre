"use client";

import { PrayerTimesDisplay } from "@/components/prayer-times/prayer-times-display";
import {
  PrayerTimesClockHeader,
} from "@/components/prayer-times/prayer-times-live-status";
import { SITE_NAME } from "@/lib/constants";
import type { PrayerTimesResponse } from "@/lib/prayer-times-client";

interface DisplayPrayerTimetableProps {
  schedule: PrayerTimesResponse;
}

export function DisplayPrayerTimetable({ schedule }: DisplayPrayerTimetableProps) {
  return (
    <section className="display-prayer-timetable">
      <header className="display-prayer-timetable-header">
        <h1 className="display-prayer-timetable-title">{SITE_NAME}</h1>
        <p className="display-prayer-timetable-subtitle">Prayer Timetable</p>
      </header>
      <PrayerTimesClockHeader
        englishDate={schedule.englishDate}
        hijriDate={schedule.hijriDate}
      />
      <PrayerTimesDisplay
        schedule={schedule}
        showEidBanner
        showBadges
      />
    </section>
  );
}

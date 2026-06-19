"use client";

import { getDisplayEffectiveNow } from "@/lib/display-time";
import { PrayerTimesDisplay } from "@/components/prayer-times/prayer-times-display";
import { findNextPrayer, type PrayerTimesResponse } from "@/lib/prayer-times-client";

interface PrayerTimesStackProps {
  schedule: PrayerTimesResponse;
  now?: Date | null;
}

export function PrayerTimesStack({ schedule, now = null }: PrayerTimesStackProps) {
  const effectiveNow = getDisplayEffectiveNow(schedule, now);
  const nextPrayer = findNextPrayer(schedule, effectiveNow);

  return (
    <section className="display-prayer-times-stack display-portrait-section">
      <PrayerTimesDisplay
        schedule={schedule}
        showEidBanner={false}
        showBadges={false}
        nextPrayer={nextPrayer}
        now={effectiveNow}
      />
    </section>
  );
}

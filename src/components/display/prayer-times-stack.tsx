"use client";

import { EidPrayerBanner } from "@/components/prayer-times/eid-prayer-banner";
import { PrayerTimesDisplay } from "@/components/prayer-times/prayer-times-display";
import type { PrayerTimesResponse } from "@/lib/prayer-times-client";

interface PrayerTimesStackProps {
  schedule: PrayerTimesResponse;
}

export function PrayerTimesStack({ schedule }: PrayerTimesStackProps) {
  return (
    <section className="display-prayer-times-stack display-portrait-section">
      {schedule.eid.type && <EidPrayerBanner eid={schedule.eid} compact />}
      <PrayerTimesDisplay schedule={schedule} showEidBanner={false} showBadges />
    </section>
  );
}

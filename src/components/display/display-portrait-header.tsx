"use client";

import { DisplayLandscapeDates } from "@/components/display/display-landscape-dates";
import { DisplayLiveTime } from "@/components/display/display-clock";
import { LOGO_PATH } from "@/lib/constants";
import type { PrayerTimesResponse } from "@/lib/prayer-times-client";

interface DisplayPortraitHeaderProps {
  schedule: PrayerTimesResponse;
  now: Date | null;
}

export function DisplayPortraitHeader({
  schedule,
  now,
}: DisplayPortraitHeaderProps) {
  return (
    <header className="display-portrait-header">
      <div className="display-portrait-header-top">
        <img
          src={LOGO_PATH}
          alt="Al Khidmah Logo"
          className="display-portrait-logo"
        />
        <DisplayLandscapeDates schedule={schedule} now={now} />
      </div>
      <DisplayLiveTime className="display-portrait-clock" />
    </header>
  );
}

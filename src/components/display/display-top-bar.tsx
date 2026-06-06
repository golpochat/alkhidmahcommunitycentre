"use client";

import Image from "next/image";
import { DisplayDates, DisplayLiveTime } from "@/components/display/display-clock";
import { LOGO_PATH, SITE_NAME } from "@/lib/constants";
import type { PrayerTimesResponse } from "@/lib/prayer-times-client";

interface DisplayTopBarProps {
  schedule: PrayerTimesResponse;
  variant?: "default" | "landscape";
}

export function DisplayTopBar({
  schedule,
  variant = "default",
}: DisplayTopBarProps) {
  if (variant === "landscape") {
    return (
      <header className="display-top-bar display-top-bar-landscape">
        <div className="display-logo-block">
          <Image
            src={LOGO_PATH}
            alt=""
            width={56}
            height={56}
            className="display-logo"
            priority
          />
        </div>
        <DisplayDates
          englishDate={schedule.englishDate}
          hijriDate={schedule.hijriDate}
          className="display-top-bar-dates"
        />
        <DisplayLiveTime className="display-top-bar-time" />
      </header>
    );
  }

  return (
    <header className="display-top-bar">
      <div className="display-logo-block">
        <Image
          src={LOGO_PATH}
          alt=""
          width={56}
          height={56}
          className="display-logo"
          priority
        />
        <p className="display-site-name">{SITE_NAME}</p>
      </div>
      <header className="display-clock">
        <DisplayDates
          englishDate={schedule.englishDate}
          hijriDate={schedule.hijriDate}
        />
        <DisplayLiveTime />
      </header>
    </header>
  );
}

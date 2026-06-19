"use client";

import Image from "next/image";
import { DisplayLandscapeDates } from "@/components/display/display-landscape-dates";
import { DisplayLiveTime } from "@/components/display/display-clock";
import { LOGO_PATH, SITE_NAME } from "@/lib/constants";
import type { PrayerTimesResponse } from "@/lib/prayer-times-client";

interface DisplayTopBarProps {
  schedule: PrayerTimesResponse;
  now?: Date | null;
  variant?: "default" | "landscape" | "portrait";
}

export function DisplayTopBar({
  schedule,
  now = null,
  variant = "default",
}: DisplayTopBarProps) {
  if (variant === "landscape" || variant === "portrait") {
    const topBarClass =
      variant === "portrait"
        ? "display-top-bar display-top-bar-portrait display-portrait-section"
        : "display-top-bar display-top-bar-landscape display-landscape-section";
    const logoClass =
      variant === "portrait"
        ? "display-logo-portrait-img"
        : "display-logo-landscape-img";

    const logoBlockClass =
      variant === "portrait"
        ? "display-logo-block display-logo-block-portrait"
        : "display-logo-block display-logo-block-landscape";

    return (
      <header className={topBarClass}>
        <div className={logoBlockClass}>
          <img src={LOGO_PATH} alt="Al Khidmah Logo" className={logoClass} />
        </div>
        <DisplayLiveTime className="display-top-bar-clock-center" />
        <DisplayLandscapeDates schedule={schedule} now={now} />
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
        <DisplayLandscapeDates schedule={schedule} now={now} />
        <DisplayLiveTime />
      </header>
    </header>
  );
}

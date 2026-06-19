"use client";

import { DisplayBottomBarSunrise } from "@/components/display/display-bottom-bar-sunrise";
import { DisplayLandscapeBottomWeather } from "@/components/display/display-landscape-bottom-weather";
import { NextPrayerCountdown } from "@/components/display/next-prayer-countdown";
import type {
  SerializedDisplayNotice,
  WeatherPayload,
} from "@/lib/display-types";
import type { SeasonalFlags } from "@/lib/seasonal-types";
import type { PrayerTimesResponse } from "@/lib/prayer-times-client";

interface DisplayBottomBarProps {
  schedule: PrayerTimesResponse;
  seasonal: SeasonalFlags;
  notices?: SerializedDisplayNotice[];
  now: Date | null;
  weather: WeatherPayload;
  showWeather: boolean;
  variant: "landscape" | "portrait";
}

export function DisplayBottomBar({
  schedule,
  seasonal,
  notices = [],
  now,
  weather,
  showWeather,
  variant,
}: DisplayBottomBarProps) {
  const hasSunrise = Boolean(schedule.sunrise);

  return (
    <footer
      className={`display-bottom-bar display-bottom-bar-${variant}${showWeather ? "" : " display-bottom-bar-no-weather"}${hasSunrise ? "" : " display-bottom-bar-no-sunrise"}`}
      aria-label="Sunrise, countdown, and weather"
    >
      {hasSunrise ? (
        <div className="display-bottom-bar-sunrise">
          <DisplayBottomBarSunrise time={schedule.sunrise} />
        </div>
      ) : null}
      <div className="display-bottom-bar-countdown">
        <NextPrayerCountdown
          schedule={schedule}
          seasonal={seasonal}
          notices={notices}
          now={now}
          variant={variant}
        />
      </div>
      {showWeather ? (
        <div className="display-bottom-bar-weather">
          <DisplayLandscapeBottomWeather weather={weather} />
        </div>
      ) : null}
    </footer>
  );
}

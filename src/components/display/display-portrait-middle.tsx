"use client";

import { DisplayLandscapeBottomWeather } from "@/components/display/display-landscape-bottom-weather";
import { NextPrayerCountdown } from "@/components/display/next-prayer-countdown";
import type { WeatherPayload } from "@/lib/display-types";
import type { SeasonalFlags } from "@/lib/seasonal-types";
import type { PrayerTimesResponse } from "@/lib/prayer-times-client";

interface DisplayPortraitMiddleProps {
  schedule: PrayerTimesResponse;
  seasonal: SeasonalFlags;
  now: Date | null;
  weather: WeatherPayload;
  showWeather?: boolean;
}

export function DisplayPortraitMiddle({
  schedule,
  seasonal,
  now,
  weather,
  showWeather = true,
}: DisplayPortraitMiddleProps) {
  return (
    <section className="display-portrait-middle" aria-label="Countdown and weather">
      <div className="display-portrait-countdown-row">
        <NextPrayerCountdown
          schedule={schedule}
          seasonal={seasonal}
          notices={[]}
          now={now}
          variant="portrait"
        />
        {showWeather ? <DisplayLandscapeBottomWeather weather={weather} /> : null}
      </div>
    </section>
  );
}

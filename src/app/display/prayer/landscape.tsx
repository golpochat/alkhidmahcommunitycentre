"use client";

import type { DisplayLayoutProps } from "@/components/display/display-layout-props";
import { DisplayLandscapeAnnouncement } from "@/components/display/display-landscape-announcement";
import { DisplayLandscapeBottomWeather } from "@/components/display/display-landscape-bottom-weather";
import { DisplayTopBar } from "@/components/display/display-top-bar";
import { NextPrayerCountdown } from "@/components/display/next-prayer-countdown";
import { PrayerTimesPanel } from "@/components/display/prayer-times-panel";
import { ScrollingTicker } from "@/components/display/scrolling-ticker";
import { SeasonalModeWrapper } from "@/components/display/seasonal-mode-wrapper";
import { EidPrayerBanner } from "@/components/prayer-times/eid-prayer-banner";

export function LandscapeDisplayLayout({
  schedule,
  seasonal,
  notices,
  weather,
  settings,
  now,
}: DisplayLayoutProps) {
  return (
    <div className="display-landscape-root">
      <DisplayTopBar
        schedule={schedule}
        now={now}
        variant="landscape"
      />

      <div className="display-landscape-main display-landscape-section">
        <SeasonalModeWrapper seasonal={seasonal} schedule={schedule} now={now}>
          {schedule.eid.type ? (
            <div className="display-landscape-eid-banner display-landscape-section">
              <EidPrayerBanner eid={schedule.eid} compact />
            </div>
          ) : null}

          <PrayerTimesPanel
            schedule={schedule}
            now={now}
            variant="landscape"
          />

          <div className="display-landscape-countdown-stage display-landscape-section">
            <div className="display-landscape-countdown-row">
              <NextPrayerCountdown
                schedule={schedule}
                seasonal={seasonal}
                notices={notices}
                now={now}
                variant="landscape"
              />
              <DisplayLandscapeBottomWeather weather={weather} />
            </div>
          </div>
        </SeasonalModeWrapper>
      </div>

      <div className="display-landscape-bottom-panel display-landscape-section">
        <DisplayLandscapeAnnouncement
          notices={notices}
          rotationSpeed={settings.rotationSpeed}
          now={now}
        />
      </div>

      <ScrollingTicker notices={notices} />
    </div>
  );
}

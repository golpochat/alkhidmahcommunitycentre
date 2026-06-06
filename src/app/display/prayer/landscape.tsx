"use client";

import type { DisplayLayoutProps } from "@/components/display/display-layout-props";
import { DisplayTopBar } from "@/components/display/display-top-bar";
import { NextPrayerCountdown } from "@/components/display/next-prayer-countdown";
import { PrayerTimesPanel } from "@/components/display/prayer-times-panel";
import { RotatingPanels } from "@/components/display/rotating-panels";
import { ScrollingTicker } from "@/components/display/scrolling-ticker";
import { SeasonalModeWrapper } from "@/components/display/seasonal-mode-wrapper";
import { EidPrayerBanner } from "@/components/prayer-times/eid-prayer-banner";

export function LandscapeDisplayLayout({
  schedule,
  seasonal,
  notices,
  events,
  ayat,
  weather,
  settings,
  now,
}: DisplayLayoutProps) {
  return (
    <div className="display-prayer-screen-inner display-landscape-layout">
      <DisplayTopBar schedule={schedule} variant="landscape" />

      <div className="display-landscape-middle">
        <SeasonalModeWrapper seasonal={seasonal} schedule={schedule} now={now}>
          {schedule.eid.type && (
            <div className="display-landscape-eid-banner">
              <EidPrayerBanner eid={schedule.eid} compact />
            </div>
          )}

          <PrayerTimesPanel schedule={schedule} now={now} />

          <div className="display-landscape-countdown-stage">
            <NextPrayerCountdown
              schedule={schedule}
              seasonal={seasonal}
              notices={notices}
              now={now}
              variant="landscape"
            />
          </div>
        </SeasonalModeWrapper>
      </div>

      <div className="display-landscape-bottom">
        <RotatingPanels
          enabledPanels={settings.enabledPanels}
          rotationSpeed={settings.rotationSpeed}
          notices={notices}
          events={events}
          ayat={ayat}
          weather={weather}
        />
        <ScrollingTicker notices={notices} />
      </div>
    </div>
  );
}

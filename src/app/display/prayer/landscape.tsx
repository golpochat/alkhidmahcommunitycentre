"use client";

import type { DisplayLayoutProps } from "@/components/display/display-layout-props";
import { DisplayLandscapeBottomWeather } from "@/components/display/display-landscape-bottom-weather";
import { RotationContainer } from "@/components/display/rotation-container";
import { DisplayTopBar } from "@/components/display/display-top-bar";
import { NextPrayerCountdown } from "@/components/display/next-prayer-countdown";
import { PrayerTimesPanel } from "@/components/display/prayer-times-panel";
import { SeasonalModeWrapper } from "@/components/display/seasonal-mode-wrapper";
import { EidPrayerBanner } from "@/components/prayer-times/eid-prayer-banner";

export function LandscapeDisplayLayout({
  schedule,
  seasonal,
  rotationMessages,
  ayat,
  weather,
  settings,
  now,
}: DisplayLayoutProps) {
  const showWeather = settings.enabledPanels.includes("weather");
  const announcementsEnabled = settings.enabledPanels.includes("announcements");
  const ayatEnabled = settings.enabledPanels.includes("ayat");
  const announcementMessages = announcementsEnabled ? rotationMessages : [];

  return (
    <div className="display-landscape-root">
      <div className="display-landscape-padded">
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
          </SeasonalModeWrapper>
        </div>

        <div className="display-landscape-stage display-landscape-section">
          <div className="display-landscape-countdown-center">
            <NextPrayerCountdown
              schedule={schedule}
              seasonal={seasonal}
              notices={[]}
              now={now}
              variant="landscape"
            />
          </div>
        </div>
      </div>

      <div className="display-landscape-messages">
        <RotationContainer
          messages={announcementMessages}
          ayat={ayat}
          ayatEnabled={ayatEnabled}
          ayatRotationSpeed={settings.rotationSpeed}
          variant="landscape"
        />
        {showWeather ? (
          <div className="display-landscape-weather-anchor">
            <DisplayLandscapeBottomWeather weather={weather} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

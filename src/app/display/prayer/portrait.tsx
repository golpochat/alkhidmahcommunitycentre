"use client";

import type { DisplayLayoutProps } from "@/components/display/display-layout-props";
import { DisplayFullscreenButton } from "@/components/display/display-fullscreen-button";
import { DisplayLandscapeBottomWeather } from "@/components/display/display-landscape-bottom-weather";
import { DisplayTopBar } from "@/components/display/display-top-bar";
import { PrayerTimesStack } from "@/components/display/prayer-times-stack";
import { NextPrayerCountdown } from "@/components/display/next-prayer-countdown";
import { RotationContainer } from "@/components/display/rotation-container";
import { SeasonalModeWrapper } from "@/components/display/seasonal-mode-wrapper";
import { EidPrayerBanner } from "@/components/prayer-times/eid-prayer-banner";

export function PortraitDisplayLayout({
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
    <div className="display-portrait-root">
      <div className="display-portrait-padded">
        <DisplayTopBar schedule={schedule} now={now} variant="landscape" />

        <div className="display-portrait-main display-portrait-section">
          <SeasonalModeWrapper seasonal={seasonal} schedule={schedule} now={now}>
            {schedule.eid.type ? (
              <div className="display-portrait-eid-banner display-portrait-section">
                <EidPrayerBanner eid={schedule.eid} compact />
              </div>
            ) : null}

            <PrayerTimesStack schedule={schedule} now={now} />
          </SeasonalModeWrapper>
        </div>

        <div className="display-portrait-stage display-portrait-section">
          <div className="display-portrait-countdown-center">
            <NextPrayerCountdown
              schedule={schedule}
              seasonal={seasonal}
              notices={[]}
              now={now}
              variant="portrait"
            />
          </div>
        </div>
      </div>

      <div className="display-portrait-messages">
        <RotationContainer
          messages={announcementMessages}
          ayat={ayat}
          ayatEnabled={ayatEnabled}
          ayatRotationSpeed={settings.rotationSpeed}
          variant="landscape"
        />
        {showWeather ? (
          <div className="display-portrait-weather-anchor">
            <DisplayLandscapeBottomWeather weather={weather} />
          </div>
        ) : null}
      </div>

      <DisplayFullscreenButton />
    </div>
  );
}

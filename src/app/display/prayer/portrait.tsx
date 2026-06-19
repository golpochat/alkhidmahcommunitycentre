"use client";

import type { DisplayLayoutProps } from "@/components/display/display-layout-props";
import { DisplayBottomBar } from "@/components/display/display-bottom-bar";
import { DisplayFullscreenButton } from "@/components/display/display-fullscreen-button";
import { DisplayTopBar } from "@/components/display/display-top-bar";
import { PrayerTimesStack } from "@/components/display/prayer-times-stack";
import { RotationContainer } from "@/components/display/rotation-container";
import { SeasonalModeWrapper } from "@/components/display/seasonal-mode-wrapper";
import { EidPrayerBanner } from "@/components/prayer-times/eid-prayer-banner";
import { isWeatherEnabled } from "@/lib/display-settings-types";

export function PortraitDisplayLayout({
  schedule,
  seasonal,
  rotationMessages,
  ayat,
  weather,
  settings,
  now,
}: DisplayLayoutProps) {
  const showWeather = isWeatherEnabled(settings.enabledPanels);

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
          <RotationContainer
            messages={rotationMessages}
            ayat={ayat}
            ayatEnabled
            ayatRotationSpeed={settings.rotationSpeed}
            variant="landscape"
            fillStage
          />
        </div>
      </div>

      <DisplayBottomBar
        schedule={schedule}
        seasonal={seasonal}
        now={now}
        weather={weather}
        showWeather={showWeather}
        variant="portrait"
      />

      <DisplayFullscreenButton />
    </div>
  );
}

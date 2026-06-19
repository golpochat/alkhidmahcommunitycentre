"use client";

import type { DisplayLayoutProps } from "@/components/display/display-layout-props";
import { DisplayFullscreenButton } from "@/components/display/display-fullscreen-button";
import { DisplayPortraitHeader } from "@/components/display/display-portrait-header";
import { RotationContainer } from "@/components/display/rotation-container";
import { DisplayPortraitMiddle } from "@/components/display/display-portrait-middle";
import { DisplayPortraitPrayerTable } from "@/components/display/display-portrait-prayer-table";

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
      <DisplayPortraitHeader schedule={schedule} now={now} />

      <DisplayPortraitPrayerTable schedule={schedule} now={now} />

      <DisplayPortraitMiddle
        schedule={schedule}
        seasonal={seasonal}
        weather={weather}
        showWeather={showWeather}
        now={now}
      />

      <RotationContainer
        messages={announcementMessages}
        ayat={ayat}
        ayatEnabled={ayatEnabled}
        ayatRotationSpeed={settings.rotationSpeed}
      />

      <DisplayFullscreenButton />
    </div>
  );
}

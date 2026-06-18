"use client";

import type { DisplayLayoutProps } from "@/components/display/display-layout-props";
import { DisplayFullscreenButton } from "@/components/display/display-fullscreen-button";
import { DisplayPortraitHeader } from "@/components/display/display-portrait-header";
import { DisplayRotatingContent } from "@/components/display/rotating-panels/display-rotating-content";
import { DisplayPortraitMiddle } from "@/components/display/display-portrait-middle";
import { DisplayPortraitPrayerTable } from "@/components/display/display-portrait-prayer-table";
import { ScrollingTicker } from "@/components/display/scrolling-ticker";

export function PortraitDisplayLayout({
  schedule,
  seasonal,
  notices,
  events,
  ayat,
  weather,
  settings,
  now,
}: DisplayLayoutProps) {
  const showWeather = settings.enabledPanels.includes("weather");

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

      <DisplayRotatingContent
        enabledPanels={settings.enabledPanels}
        excludePanels={["weather"]}
        rotationSpeed={settings.rotationSpeed}
        notices={notices}
        events={events}
        ayat={ayat}
        weather={weather}
        now={now}
        variant="default"
      />

      <DisplayFullscreenButton />
      <ScrollingTicker notices={notices} now={now} />
    </div>
  );
}

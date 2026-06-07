"use client";

import type { DisplayLayoutProps } from "@/components/display/display-layout-props";
import { DisplayFullscreenButton } from "@/components/display/display-fullscreen-button";
import { DisplayPortraitHeader } from "@/components/display/display-portrait-header";
import { DisplayPortraitInfoPanels } from "@/components/display/display-portrait-info-panels";
import { DisplayPortraitMiddle } from "@/components/display/display-portrait-middle";
import { DisplayPortraitPrayerTable } from "@/components/display/display-portrait-prayer-table";
import { ScrollingTicker } from "@/components/display/scrolling-ticker";

export function PortraitDisplayLayout({
  schedule,
  seasonal,
  notices,
  events,
  weather,
  settings,
  now,
}: DisplayLayoutProps) {
  return (
    <div className="display-portrait-root">
      <DisplayPortraitHeader schedule={schedule} now={now} />

      <DisplayPortraitPrayerTable schedule={schedule} now={now} />

      <DisplayPortraitMiddle
        schedule={schedule}
        seasonal={seasonal}
        weather={weather}
        now={now}
      />

      <DisplayPortraitInfoPanels
        notices={notices}
        events={events}
        rotationSpeed={settings.rotationSpeed}
        now={now}
      />

      <DisplayFullscreenButton />
      <ScrollingTicker notices={notices} />
    </div>
  );
}

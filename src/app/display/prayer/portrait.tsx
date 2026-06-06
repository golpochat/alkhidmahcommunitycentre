"use client";

import { AnnouncementsPanel } from "@/components/display/rotating-panels/announcements-panel";
import { EventsPanel } from "@/components/display/rotating-panels/events-panel";
import { DisplayFullscreenButton } from "@/components/display/display-fullscreen-button";
import type { DisplayLayoutProps } from "@/components/display/display-layout-props";
import { DisplayPriorityCountdown } from "@/components/display/display-priority-countdown";
import { DisplayTopBar } from "@/components/display/display-top-bar";
import { NextPrayerCountdown } from "@/components/display/next-prayer-countdown";
import { PrayerTimesStack } from "@/components/display/prayer-times-stack";
import { ScrollingTicker } from "@/components/display/scrolling-ticker";
import { SeasonalModeWrapper } from "@/components/display/seasonal-mode-wrapper";

export function PortraitDisplayLayout({
  schedule,
  seasonal,
  notices,
  events,
  settings,
  now,
}: DisplayLayoutProps) {
  const showAnnouncements = settings.enabledPanels.includes("announcements");
  const showEvents = settings.enabledPanels.includes("events");

  return (
    <div className="display-prayer-screen-inner display-portrait-layout">
      <DisplayTopBar schedule={schedule} />

      <SeasonalModeWrapper seasonal={seasonal} schedule={schedule} now={now}>
        <DisplayPriorityCountdown
          schedule={schedule}
          seasonal={seasonal}
          notices={notices}
          now={now}
          variant="large"
        />

        <div className="display-portrait-countdown-stage">
          <NextPrayerCountdown
            schedule={schedule}
            seasonal={seasonal}
            notices={notices}
            now={now}
            variant="large"
          />
        </div>

        <div className="display-portrait-stack-stage">
          <PrayerTimesStack schedule={schedule} />
        </div>
      </SeasonalModeWrapper>

      <div className="display-portrait-panels">
        {showAnnouncements && (
          <AnnouncementsPanel
            notices={notices}
            rotationSpeed={settings.rotationSpeed}
          />
        )}
        {showEvents && <EventsPanel events={events} />}
      </div>

      <ScrollingTicker notices={notices} />
      <DisplayFullscreenButton />
    </div>
  );
}

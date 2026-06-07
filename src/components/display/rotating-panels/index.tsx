"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnnouncementsPanel } from "@/components/display/rotating-panels/announcements-panel";
import { AyahPanel } from "@/components/display/rotating-panels/ayah-panel";
import { EventsPanel } from "@/components/display/rotating-panels/events-panel";
import { WeatherPanel } from "@/components/display/rotating-panels/weather-panel";
import type { CachedAyah } from "@/lib/display-cache";
import type { SerializedDisplayNotice, WeatherPayload } from "@/lib/display-types";
import type { SerializedEvent } from "@/lib/events";

interface RotatingPanelsProps {
  enabledPanels: string[];
  rotationSpeed: number;
  notices: SerializedDisplayNotice[];
  events: SerializedEvent[];
  ayat: CachedAyah[];
  weather: WeatherPayload;
  hideAnnouncementDots?: boolean;
  variant?: "default" | "landscape";
}

export function RotatingPanels({
  enabledPanels,
  rotationSpeed,
  notices,
  events,
  ayat,
  weather,
  hideAnnouncementDots = false,
  variant = "default",
}: RotatingPanelsProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [ayahIndex, setAyahIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  const panels = useMemo(() => {
    const list: Array<{ key: string; node: ReactNode }> = [];

    if (enabledPanels.includes("announcements")) {
      list.push({
        key: "announcements",
        node: (
          <AnnouncementsPanel
            notices={notices}
            rotationSpeed={rotationSpeed}
            hideDots={hideAnnouncementDots}
            variant={variant}
          />
        ),
      });
    }
    if (enabledPanels.includes("events")) {
      list.push({
        key: "events",
        node: <EventsPanel events={events} variant={variant} />,
      });
    }
    if (enabledPanels.includes("ayat")) {
      list.push({
        key: "ayat",
        node: <AyahPanel ayat={ayat} index={ayahIndex} variant={variant} />,
      });
    }
    if (enabledPanels.includes("weather")) {
      list.push({
        key: "weather",
        node: <WeatherPanel weather={weather} />,
      });
    }

    return list;
  }, [enabledPanels, notices, events, ayat, ayahIndex, weather, rotationSpeed, hideAnnouncementDots, variant]);

  useEffect(() => {
    if (panels.length <= 1) return;

    const intervalMs = Math.max(5, rotationSpeed) * 1000;
    const interval = setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setActiveIndex((current) => (current + 1) % panels.length);
        setAyahIndex((current) => current + 1);
        setVisible(true);
      }, 500);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [panels.length, rotationSpeed]);

  if (!panels.length) return null;

  const activePanel = panels[activeIndex % panels.length];

  return (
    <section className="display-rotating-panels">
      <div
        className={`display-rotating-panels-inner${visible ? " display-rotating-panels-visible" : " display-rotating-panels-hidden"}`}
      >
        {activePanel.node}
      </div>
      {panels.length > 1 && (
        <div className="display-rotating-panels-dots">
          {panels.map((panel, index) => (
            <span
              key={panel.key}
              className={`display-rotating-panels-dot${index === activeIndex ? " display-rotating-panels-dot-active" : ""}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

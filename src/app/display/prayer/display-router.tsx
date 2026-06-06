"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LandscapeDisplayLayout } from "@/app/display/prayer/landscape";
import { PortraitDisplayLayout } from "@/app/display/prayer/portrait";
import { BackgroundPattern } from "@/components/display/background-pattern";
import type { DisplayTodayResponse } from "@/components/display/display-layout-props";
import type { CachedAyah } from "@/lib/display-cache";
import type { SerializedDisplayNotice, WeatherPayload } from "@/lib/display-types";
import type { SerializedDisplaySettings } from "@/lib/display-settings";
import type { SerializedEvent } from "@/lib/events";
import { resolveDisplayOrientation } from "@/lib/display-orientation";
import { useOrientation } from "@/hooks/useOrientation";
import { isAfterIsha } from "@/lib/seasonal-client";

interface DisplayRouterProps {
  initialToday: DisplayTodayResponse;
  initialNotices: SerializedDisplayNotice[];
  initialEvents: SerializedEvent[];
  initialAyat: CachedAyah[];
  initialWeather: WeatherPayload;
  initialSettings: SerializedDisplaySettings;
}

export function DisplayRouter({
  initialToday,
  initialNotices,
  initialEvents,
  initialAyat,
  initialWeather,
  initialSettings,
}: DisplayRouterProps) {
  const detectedOrientation = useOrientation();
  const [schedule, setSchedule] = useState(initialToday.schedule);
  const [seasonal, setSeasonal] = useState(initialToday.seasonal);
  const [notices, setNotices] = useState(initialNotices);
  const [events, setEvents] = useState(initialEvents);
  const [ayat, setAyat] = useState(initialAyat);
  const [weather, setWeather] = useState(initialWeather);
  const [settings, setSettings] = useState(initialSettings);
  const [now, setNow] = useState(() => new Date());

  const orientation = resolveDisplayOrientation(
    settings.orientationOverride,
    detectedOrientation
  );

  const refreshData = useCallback(async () => {
    try {
      const [todayRes, noticesRes, eventsRes, ayatRes, settingsRes] =
        await Promise.all([
          fetch("/api/display/today", { cache: "no-store" }),
          fetch("/api/display/notices", { cache: "no-store" }),
          fetch("/api/display/events", { cache: "no-store" }),
          fetch("/api/display/ayat", { cache: "no-store" }),
          fetch("/api/display/settings", { cache: "no-store" }),
        ]);

      if (todayRes.ok) {
        const data: DisplayTodayResponse = await todayRes.json();
        setSchedule(data.schedule);
        setSeasonal(data.seasonal);
        setWeather(data.weather);
      }

      if (noticesRes.ok) setNotices(await noticesRes.json());
      if (eventsRes.ok) setEvents(await eventsRes.json());
      if (ayatRes.ok) setAyat(await ayatRes.json());
      if (settingsRes.ok) setSettings(await settingsRes.json());
    } catch {
      // Keep showing last good data on TV screens
    }
  }, []);

  useEffect(() => {
    const dataInterval = setInterval(refreshData, 60_000);
    return () => clearInterval(dataInterval);
  }, [refreshData]);

  useEffect(() => {
    const clockInterval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(clockInterval);
  }, []);

  useEffect(() => {
    if (!settings.autoFullscreen) return;

    document.documentElement.classList.add("display-kiosk-mode");
    return () => {
      document.documentElement.classList.remove("display-kiosk-mode");
    };
  }, [settings.autoFullscreen]);

  const themeClass = useMemo(() => {
    const base = `display-theme-${settings.theme}`;
    const night =
      settings.theme === "hybrid" && isAfterIsha(schedule, now)
        ? " display-theme-night"
        : "";
    return `${base}${night}`;
  }, [settings.theme, schedule, now]);

  const layoutProps = {
    schedule,
    seasonal,
    notices,
    events,
    ayat,
    weather,
    settings,
    now,
  };

  const viewportClass =
    orientation === "portrait"
      ? "display-viewport display-viewport-portrait"
      : "display-viewport display-viewport-landscape";

  return (
    <div className={`display-prayer-screen ${themeClass}`}>
      <BackgroundPattern />
      <div className={viewportClass}>
        {orientation === "portrait" ? (
          <PortraitDisplayLayout {...layoutProps} />
        ) : (
          <LandscapeDisplayLayout {...layoutProps} />
        )}
      </div>
    </div>
  );
}

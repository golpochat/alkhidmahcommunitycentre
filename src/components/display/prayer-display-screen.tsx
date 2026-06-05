"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BackgroundPattern } from "@/components/display/background-pattern";
import { DisplayPrayerTimetable } from "@/components/display/display-prayer-timetable";
import { NextPrayerCountdown } from "@/components/display/next-prayer-countdown";
import { RotatingPanels } from "@/components/display/rotating-panels";
import { ScrollingTicker } from "@/components/display/scrolling-ticker";
import { SeasonalModeWrapper } from "@/components/display/seasonal-mode-wrapper";
import type { CachedAyah } from "@/lib/display-cache";
import type { SerializedDisplayNotice, WeatherPayload } from "@/lib/display-types";
import type { SerializedDisplaySettings } from "@/lib/display-settings";
import type { SerializedEvent } from "@/lib/events";
import { isAfterIsha, shouldShowJumuahCountdown } from "@/lib/seasonal-client";
import type { SeasonalFlags } from "@/lib/seasonal-types";
import type { PrayerTimesResponse } from "@/lib/prayer-times-client";

interface DisplayTodayResponse {
  schedule: PrayerTimesResponse;
  seasonal: SeasonalFlags;
  weather: WeatherPayload;
  fetchedAt: string;
}

interface PrayerDisplayScreenProps {
  initialToday: DisplayTodayResponse;
  initialNotices: SerializedDisplayNotice[];
  initialEvents: SerializedEvent[];
  initialAyat: CachedAyah[];
  initialWeather: WeatherPayload;
  initialSettings: SerializedDisplaySettings;
}

export function PrayerDisplayScreen({
  initialToday,
  initialNotices,
  initialEvents,
  initialAyat,
  initialWeather,
  initialSettings,
}: PrayerDisplayScreenProps) {
  const [schedule, setSchedule] = useState(initialToday.schedule);
  const [seasonal, setSeasonal] = useState(initialToday.seasonal);
  const [notices, setNotices] = useState(initialNotices);
  const [events, setEvents] = useState(initialEvents);
  const [ayat, setAyat] = useState(initialAyat);
  const [weather, setWeather] = useState(initialWeather);
  const [settings, setSettings] = useState(initialSettings);
  const [now, setNow] = useState(() => new Date());

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

  const themeClass = useMemo(() => {
    const base = `display-theme-${settings.theme}`;
    const night =
      settings.theme === "hybrid" && isAfterIsha(schedule, now)
        ? " display-theme-night"
        : "";
    return `${base}${night}`;
  }, [settings.theme, schedule, now]);

  const showJumuahBanner = shouldShowJumuahCountdown(schedule, now);

  return (
    <div className={`display-prayer-screen ${themeClass}`}>
      <BackgroundPattern />

      <div className="display-viewport">
        <div className="display-prayer-screen-inner">
          <div className="display-center-stage">
            <SeasonalModeWrapper seasonal={seasonal} schedule={schedule} now={now}>
              <DisplayPrayerTimetable schedule={schedule} />
              <NextPrayerCountdown
                schedule={schedule}
                seasonal={seasonal}
                notices={notices}
              />
            </SeasonalModeWrapper>
          </div>

          <div className="display-bottom-stage">
            <RotatingPanels
              enabledPanels={settings.enabledPanels}
              rotationSpeed={settings.rotationSpeed}
              notices={notices}
              events={events}
              ayat={ayat}
              weather={weather}
              seasonal={seasonal}
              schedule={schedule}
              showJumuahBanner={showJumuahBanner}
            />
          </div>

          <ScrollingTicker notices={notices} />
        </div>
      </div>
    </div>
  );
}

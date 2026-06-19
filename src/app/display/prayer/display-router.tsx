"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLiveNow } from "@/hooks/useLiveNow";
import { useDisplayBrightness } from "@/hooks/useDisplayBrightness";
import { LandscapeDisplayLayout } from "@/app/display/prayer/landscape";
import { PortraitDisplayLayout } from "@/app/display/prayer/portrait";
import { BackgroundPattern } from "@/components/display/background-pattern";
import { DisplayPinGate } from "@/components/display/display-pin-gate";
import type { DisplayTodayResponse } from "@/components/display/display-layout-props";
import type { CachedAyah } from "@/lib/display-cache";
import type { WeatherPayload } from "@/lib/display-types";
import type { SerializedDisplaySettings } from "@/lib/display-settings";
import type { SerializedEvent } from "@/lib/events";
import { rotationClient, type RotationMessage } from "@/lib/rotation-client";
import { rotationMessagesKey } from "@/lib/display-bottom-slides";
import { resolveDisplayOrientation } from "@/lib/display-orientation";
import { useOrientation } from "@/hooks/useOrientation";
import { isAfterIsha } from "@/lib/seasonal-client";

interface DisplayRouterProps {
  initialToday: DisplayTodayResponse;
  initialRotationMessages: RotationMessage[];
  initialEvents: SerializedEvent[];
  initialAyat: CachedAyah[];
  initialWeather: WeatherPayload;
  initialSettings: SerializedDisplaySettings;
}

function rotationQueueKey(messages: RotationMessage[]) {
  return rotationMessagesKey(messages);
}

export function DisplayRouter({
  initialToday,
  initialRotationMessages,
  initialEvents,
  initialAyat,
  initialWeather,
  initialSettings,
}: DisplayRouterProps) {
  const detectedOrientation = useOrientation();
  const [schedule, setSchedule] = useState(initialToday.schedule);
  const [seasonal, setSeasonal] = useState(initialToday.seasonal);
  const [rotationMessages, setRotationMessages] = useState(
    initialRotationMessages,
  );
  const [events, setEvents] = useState(initialEvents);
  const [ayat, setAyat] = useState(initialAyat);
  const [weather, setWeather] = useState(initialWeather);
  const [settings, setSettings] = useState(initialSettings);
  const now = useLiveNow();

  const orientation = resolveDisplayOrientation(
    settings.orientationOverride,
    detectedOrientation
  );

  const refreshData = useCallback(async () => {
    try {
      const [todayRes, eventsRes, ayatRes, settingsRes] = await Promise.all([
        fetch("/api/display/today", { cache: "no-store" }),
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

      if (eventsRes.ok) setEvents(await eventsRes.json());
      if (ayatRes.ok) setAyat(await ayatRes.json());
      if (settingsRes.ok) setSettings(await settingsRes.json());
    } catch {
      // Keep showing last good data on TV screens
    }
  }, []);

  useEffect(() => {
    const fetchRotation = async () => {
      try {
        const data = await rotationClient.fetchRotationQueue();
        setRotationMessages((current) =>
          rotationQueueKey(current) === rotationQueueKey(data) ? current : data,
        );
      } catch {
        // Keep showing last good rotation queue on TV screens
      }
    };

    void fetchRotation();
    const rotationInterval = setInterval(() => {
      void fetchRotation();
    }, 2000);

    return () => clearInterval(rotationInterval);
  }, []);

  useEffect(() => {
    const dataInterval = setInterval(refreshData, 60_000);
    return () => clearInterval(dataInterval);
  }, [refreshData]);

  useEffect(() => {
    function sendHeartbeat() {
      fetch("/api/analytics/display-heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orientation }),
      }).catch(() => undefined);
    }

    sendHeartbeat();
    const heartbeatInterval = setInterval(sendHeartbeat, 5 * 60_000);
    return () => clearInterval(heartbeatInterval);
  }, [orientation]);

  useDisplayBrightness(settings.brightnessSchedule);

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
      settings.theme === "hybrid" && now && isAfterIsha(schedule, now)
        ? " display-theme-night"
        : "";
    return `${base}${night}`;
  }, [settings.theme, schedule, now]);

  const layoutProps = {
    schedule,
    seasonal,
    rotationMessages,
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
    <DisplayPinGate pinCode={settings.pinCode}>
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
    </DisplayPinGate>
  );
}

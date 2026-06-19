"use client";

import { useEffect } from "react";
import {
  brightnessPeriodsFromStorage,
  brightnessPeriodsToStorage,
} from "@/lib/display-brightness";

interface BrightnessEntry {
  from: string;
  to: string;
  brightness: number;
}

function parseSchedule(value: unknown): BrightnessEntry[] {
  return brightnessPeriodsToStorage(brightnessPeriodsFromStorage(value));
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function isWithinRange(nowMinutes: number, from: string, to: string) {
  const start = timeToMinutes(from);
  const end = timeToMinutes(to);

  if (start <= end) {
    return nowMinutes >= start && nowMinutes < end;
  }

  return nowMinutes >= start || nowMinutes < end;
}

export function useDisplayBrightness(schedule: unknown) {
  useEffect(() => {
    const entries = parseSchedule(schedule);
    if (entries.length === 0) return;

    function applyBrightness() {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const match = entries.find((entry) => isWithinRange(nowMinutes, entry.from, entry.to));
      const brightness = match?.brightness ?? 1;
      document.documentElement.style.setProperty(
        "--display-brightness",
        String(brightness),
      );
    }

    applyBrightness();
    const interval = setInterval(applyBrightness, 60_000);
    return () => {
      clearInterval(interval);
      document.documentElement.style.removeProperty("--display-brightness");
    };
  }, [schedule]);
}

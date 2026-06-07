"use client";

import { useEffect } from "react";

interface BrightnessEntry {
  from: string;
  to: string;
  brightness: number;
}

function parseSchedule(value: unknown): BrightnessEntry[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const item = entry as Record<string, unknown>;
      const from = String(item.from ?? "");
      const to = String(item.to ?? "");
      const brightness = Number(item.brightness);
      if (!from || !to || !Number.isFinite(brightness)) return null;
      return { from, to, brightness: Math.min(1, Math.max(0.2, brightness)) };
    })
    .filter(Boolean) as BrightnessEntry[];
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

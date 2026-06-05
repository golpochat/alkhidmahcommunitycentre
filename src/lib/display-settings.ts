import "server-only";

import { db } from "@/lib/db";

export const DEFAULT_ENABLED_PANELS = [
  "announcements",
  "events",
  "ayat",
  "weather",
] as const;

export type DisplayPanelKey = (typeof DEFAULT_ENABLED_PANELS)[number];

export type DisplayTheme = "hybrid" | "dark" | "light";

export interface SerializedDisplaySettings {
  id: string;
  rotationSpeed: number;
  enabledPanels: string[];
  theme: DisplayTheme;
  pinCode: string | null;
  brightnessSchedule: unknown;
}

const DEFAULT_SETTINGS = {
  rotationSpeed: 10,
  enabledPanels: [...DEFAULT_ENABLED_PANELS],
  theme: "hybrid" as DisplayTheme,
  pinCode: null as string | null,
  brightnessSchedule: null as unknown,
};

export async function ensureDisplaySettings() {
  const existing = await db.displaySettings.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (existing) return existing;

  return db.displaySettings.create({
    data: {
      rotationSpeed: DEFAULT_SETTINGS.rotationSpeed,
      enabledPanels: DEFAULT_SETTINGS.enabledPanels,
      theme: DEFAULT_SETTINGS.theme,
    },
  });
}

export function serializeDisplaySettings(
  settings: Awaited<ReturnType<typeof ensureDisplaySettings>>
): SerializedDisplaySettings {
  return {
    id: settings.id,
    rotationSpeed: settings.rotationSpeed,
    enabledPanels: settings.enabledPanels.length
      ? settings.enabledPanels
      : [...DEFAULT_ENABLED_PANELS],
    theme: (settings.theme as DisplayTheme) || "hybrid",
    pinCode: settings.pinCode,
    brightnessSchedule: settings.brightnessSchedule,
  };
}

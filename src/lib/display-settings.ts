import "server-only";

import { db } from "@/lib/db";
import type {
  DisplayTheme,
  OrientationOverride,
  SerializedDisplaySettings,
} from "@/lib/display-settings-types";

export type {
  DisplayTheme,
  OrientationOverride,
  SerializedDisplaySettings,
} from "@/lib/display-settings-types";

export {
  isWeatherEnabled,
  weatherEnabledPanels,
} from "@/lib/display-settings-types";

const DEFAULT_SETTINGS = {
  rotationSpeed: 10,
  enabledPanels: ["weather"],
  theme: "hybrid" as DisplayTheme,
  pinCode: null as string | null,
  brightnessSchedule: null as unknown,
  orientationOverride: null as OrientationOverride,
  autoFullscreen: false,
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
      autoFullscreen: DEFAULT_SETTINGS.autoFullscreen,
    },
  });
}

export function serializeDisplaySettings(
  settings: Awaited<ReturnType<typeof ensureDisplaySettings>>,
): SerializedDisplaySettings {
  return {
    id: settings.id,
    rotationSpeed: settings.rotationSpeed,
    enabledPanels: settings.enabledPanels,
    theme: (settings.theme as DisplayTheme) || "hybrid",
    pinCode: settings.pinCode,
    brightnessSchedule: settings.brightnessSchedule,
    orientationOverride:
      settings.orientationOverride === "landscape" ||
      settings.orientationOverride === "portrait"
        ? settings.orientationOverride
        : null,
    autoFullscreen: settings.autoFullscreen ?? false,
    lastSeenAt: settings.lastSeenAt?.toISOString() ?? null,
    lastOrientation: settings.lastOrientation ?? null,
  };
}

export type DisplayTheme = "hybrid" | "dark" | "light";

export type OrientationOverride = "landscape" | "portrait" | null;

export interface SerializedDisplaySettings {
  id: string;
  rotationSpeed: number;
  enabledPanels: string[];
  theme: DisplayTheme;
  pinCode: string | null;
  brightnessSchedule: unknown;
  orientationOverride: OrientationOverride;
  autoFullscreen: boolean;
  lastSeenAt: string | null;
  lastOrientation: string | null;
}

export function isWeatherEnabled(enabledPanels: string[]) {
  return enabledPanels.includes("weather");
}

export function weatherEnabledPanels(showWeather: boolean): string[] {
  return showWeather ? ["weather"] : [];
}

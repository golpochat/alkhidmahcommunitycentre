export type DisplayTheme = "hybrid" | "dark" | "light";

export type OrientationOverride = "landscape" | "portrait" | null;

export const DISPLAY_PANEL_WEATHER = "weather";
export const DISPLAY_PANEL_PRIORITY_MESSAGES = "priority-messages";
export const DISPLAY_PANEL_NORMAL_MESSAGES = "normal-messages";
export const DISPLAY_PANEL_AYAT_HADITH = "ayat-hadith";

export const ROTATION_DISPLAY_PANELS = [
  DISPLAY_PANEL_PRIORITY_MESSAGES,
  DISPLAY_PANEL_NORMAL_MESSAGES,
  DISPLAY_PANEL_AYAT_HADITH,
] as const;

export type RotationDisplayPanel = (typeof ROTATION_DISPLAY_PANELS)[number];

export interface DisplaySectionPanelState {
  priorityMessages: boolean;
  normalMessages: boolean;
  ayatHadith: boolean;
  showWeather: boolean;
}

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
  return enabledPanels.includes(DISPLAY_PANEL_WEATHER);
}

export function panelsEqual(left: string[], right: string[]) {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every((panel) => rightSet.has(panel));
}

export function isPriorityMessagesEnabled(enabledPanels: string[]) {
  return enabledPanels.includes(DISPLAY_PANEL_PRIORITY_MESSAGES);
}

export function isNormalMessagesEnabled(enabledPanels: string[]) {
  return enabledPanels.includes(DISPLAY_PANEL_NORMAL_MESSAGES);
}

export function isAyatHadithEnabled(enabledPanels: string[]) {
  return enabledPanels.includes(DISPLAY_PANEL_AYAT_HADITH);
}

export function parseDisplaySectionPanels(
  enabledPanels: string[],
): DisplaySectionPanelState {
  return {
    showWeather: isWeatherEnabled(enabledPanels),
    priorityMessages: isPriorityMessagesEnabled(enabledPanels),
    normalMessages: isNormalMessagesEnabled(enabledPanels),
    ayatHadith: isAyatHadithEnabled(enabledPanels),
  };
}

export function buildEnabledPanels(
  config: DisplaySectionPanelState,
): string[] {
  const panels: string[] = [];
  if (config.showWeather) panels.push(DISPLAY_PANEL_WEATHER);
  if (config.priorityMessages) panels.push(DISPLAY_PANEL_PRIORITY_MESSAGES);
  if (config.normalMessages) panels.push(DISPLAY_PANEL_NORMAL_MESSAGES);
  if (config.ayatHadith) panels.push(DISPLAY_PANEL_AYAT_HADITH);
  return panels;
}

export function setDisplayPanelEnabled(
  enabledPanels: string[],
  panel: string,
  enabled: boolean,
): string[] {
  const next: DisplaySectionPanelState = {
    showWeather: isWeatherEnabled(enabledPanels),
    priorityMessages:
      panel === DISPLAY_PANEL_PRIORITY_MESSAGES
        ? enabled
        : isPriorityMessagesEnabled(enabledPanels),
    normalMessages:
      panel === DISPLAY_PANEL_NORMAL_MESSAGES
        ? enabled
        : isNormalMessagesEnabled(enabledPanels),
    ayatHadith:
      panel === DISPLAY_PANEL_AYAT_HADITH
        ? enabled
        : isAyatHadithEnabled(enabledPanels),
  };
  return buildEnabledPanels(next);
}

export function weatherEnabledPanels(showWeather: boolean): string[] {
  return showWeather ? [DISPLAY_PANEL_WEATHER] : [];
}

export interface BrightnessPeriod {
  from: string;
  to: string;
  /** 20–100 (percent) */
  brightnessPercent: number;
}

const DEFAULT_PERIODS: BrightnessPeriod[] = [
  { from: "06:00", to: "22:00", brightnessPercent: 100 },
  { from: "22:00", to: "06:00", brightnessPercent: 40 },
];

export function defaultBrightnessPeriods(): BrightnessPeriod[] {
  return DEFAULT_PERIODS.map((item) => ({ ...item }));
}

function isTimeString(value: string) {
  return /^\d{2}:\d{2}$/.test(value);
}

function clampPercent(value: number) {
  return Math.min(100, Math.max(20, Math.round(value)));
}

/** Stored in DB — array of { from, to, brightness } where brightness is 0.2–1 */
export function brightnessPeriodsToStorage(periods: BrightnessPeriod[]) {
  return periods
    .filter(
      (item) =>
        isTimeString(item.from) &&
        isTimeString(item.to) &&
        Number.isFinite(item.brightnessPercent),
    )
    .map((item) => ({
      from: item.from,
      to: item.to,
      brightness: clampPercent(item.brightnessPercent) / 100,
    }));
}

export function brightnessPeriodsFromStorage(value: unknown): BrightnessPeriod[] {
  if (value == null) return defaultBrightnessPeriods();

  if (Array.isArray(value)) {
    const parsed = value
      .map((entry) => {
        if (!entry || typeof entry !== "object") return null;
        const item = entry as Record<string, unknown>;
        const from = String(item.from ?? "");
        const to = String(item.to ?? "");
        const rawBrightness = Number(item.brightness);
        if (!isTimeString(from) || !isTimeString(to) || !Number.isFinite(rawBrightness)) {
          return null;
        }
        const brightnessPercent =
          rawBrightness <= 1
            ? clampPercent(rawBrightness * 100)
            : clampPercent(rawBrightness);
        return { from, to, brightnessPercent };
      })
      .filter(Boolean) as BrightnessPeriod[];

    return parsed.length > 0 ? parsed : defaultBrightnessPeriods();
  }

  if (typeof value === "object") {
    const legacy = value as Record<string, unknown>;
    const periods = Object.entries(legacy)
      .filter(([time]) => isTimeString(time))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([from, level], index, entries) => {
        const next = entries[index + 1];
        const to = next ? next[0] : entries[0][0];
        const brightnessPercent = clampPercent(Number(level));
        return { from, to, brightnessPercent };
      });

    return periods.length > 0 ? periods : defaultBrightnessPeriods();
  }

  return defaultBrightnessPeriods();
}

export function formatBrightnessPercent(percent: number) {
  return `${clampPercent(percent)}%`;
}

import type { DailyPrayerKey } from "@/lib/prayer-iqama";

export type { DailyPrayerKey };

export const DAILY_PRAYER_KEYS: DailyPrayerKey[] = [
  "fajr",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
];

export type AdhanMode = "offset" | "fixed" | "text";

export interface PrayerAdhanConfig {
  mode: AdhanMode;
  offsetMinutes: number;
  fixed?: string;
  text?: string;
}

export type DailyAdhanConfig = Partial<Record<DailyPrayerKey, PrayerAdhanConfig>>;

export type ApiAdhanTimings = {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
};

const API_ADHAN_BY_PRAYER: Record<DailyPrayerKey, keyof ApiAdhanTimings> = {
  fajr: "Fajr",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

function normalizeTime(value?: string | null) {
  if (!value) return null;
  return value.split(" ")[0].slice(0, 5);
}

function parseTimeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function addMinutesToTime(time: string, minutes: number) {
  const total = parseTimeToMinutes(time) + minutes;
  const normalized = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function parseOffsetMinutes(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) return Math.trunc(parsed);
  }

  return null;
}

export function defaultAdhanConfig(): DailyAdhanConfig {
  return Object.fromEntries(
    DAILY_PRAYER_KEYS.map((key) => [key, defaultAdhanConfigEntry()])
  ) as DailyAdhanConfig;
}

export function defaultAdhanConfigEntry(): PrayerAdhanConfig {
  return { mode: "offset", offsetMinutes: 0 };
}

export function parseDailyAdhanConfig(value: unknown): DailyAdhanConfig | null {
  if (!value || typeof value !== "object") return null;

  const parsed: DailyAdhanConfig = {};

  for (const key of DAILY_PRAYER_KEYS) {
    const entry = (value as Record<string, unknown>)[key];
    if (!entry || typeof entry !== "object") continue;

    const raw = entry as Record<string, unknown>;
    const mode: AdhanMode =
      raw.mode === "fixed"
        ? "fixed"
        : raw.mode === "text"
          ? "text"
          : "offset";
    const offsetMinutes = parseOffsetMinutes(raw.offsetMinutes) ?? 0;
    const fixed = normalizeTime(raw.fixed as string | null | undefined);
    const text =
      typeof raw.text === "string" ? raw.text.trim() : undefined;

    if (mode === "text" && text) {
      parsed[key] = { mode: "text", offsetMinutes: 0, text };
      continue;
    }

    if (mode === "fixed" && fixed) {
      parsed[key] = { mode: "fixed", offsetMinutes: 0, fixed };
      continue;
    }

    parsed[key] = { mode: "offset", offsetMinutes, fixed: fixed ?? undefined };
  }

  return Object.keys(parsed).length > 0 ? parsed : null;
}

export function getApiAdhanForPrayer(
  prayer: DailyPrayerKey,
  apiTimings: ApiAdhanTimings
) {
  return normalizeTime(apiTimings[API_ADHAN_BY_PRAYER[prayer]]);
}

export function apiAdhanRecordFromTimings(
  apiTimings: ApiAdhanTimings
): Record<DailyPrayerKey, string> {
  return Object.fromEntries(
    DAILY_PRAYER_KEYS.map((key) => [
      key,
      getApiAdhanForPrayer(key, apiTimings) || "",
    ])
  ) as Record<DailyPrayerKey, string>;
}

export function inferAdhanConfigFromLegacy(
  override: Partial<Record<`${DailyPrayerKey}Adhan`, string | null>>,
  apiAdhan: Record<DailyPrayerKey, string>
): DailyAdhanConfig {
  const config = defaultAdhanConfig();

  for (const key of DAILY_PRAYER_KEYS) {
    const legacy = normalizeTime(override[`${key}Adhan`]);
    const api = normalizeTime(apiAdhan[key]);

    if (!legacy || !api) continue;

    config[key] = {
      mode: "offset",
      offsetMinutes: parseTimeToMinutes(legacy) - parseTimeToMinutes(api),
    };
  }

  return config;
}

export function buildDailyAdhanConfigFromOverride(
  override:
    | (Partial<Record<`${DailyPrayerKey}Adhan`, string | null>> & {
        adhanConfig?: unknown;
      })
    | null
    | undefined,
  apiTimings: ApiAdhanTimings
): DailyAdhanConfig {
  const stored = parseDailyAdhanConfig(override?.adhanConfig);
  if (stored) {
    return { ...defaultAdhanConfig(), ...stored };
  }

  if (!override) return defaultAdhanConfig();

  return inferAdhanConfigFromLegacy(
    override,
    apiAdhanRecordFromTimings(apiTimings)
  );
}

export function resolveAdhan(
  apiAdhan: string | null | undefined,
  config: PrayerAdhanConfig | undefined
) {
  if (config?.mode === "text") {
    return null;
  }

  if (config?.mode === "fixed") {
    return normalizeTime(config.fixed) || normalizeTime(apiAdhan);
  }

  const normalized = normalizeTime(apiAdhan);
  if (!normalized) return null;

  const offset = config?.offsetMinutes ?? 0;
  if (offset === 0) return normalized;

  return addMinutesToTime(normalized, offset);
}

export function resolveAdhanDisplay(
  apiAdhan: string | null | undefined,
  config: PrayerAdhanConfig | undefined,
) {
  if (config?.mode === "text") {
    return config.text?.trim() || null;
  }

  return resolveAdhan(apiAdhan, config);
}

export function resolveAdhanSlot(
  apiAdhan: string | null | undefined,
  config: PrayerAdhanConfig | undefined,
) {
  const adhanDisplay = resolveAdhanDisplay(apiAdhan, config);
  const adhan =
    config?.mode === "text" ? null : resolveAdhan(apiAdhan, config);

  return {
    adhan,
    adhanDisplay: config?.mode === "text" ? adhanDisplay : adhan,
  };
}

export function resolveAdhanFromApi(
  apiAdhan: string | null | undefined,
  config: PrayerAdhanConfig | undefined
) {
  return resolveAdhan(apiAdhan, config);
}

export function hasAdhanOverrides(config: DailyAdhanConfig) {
  return DAILY_PRAYER_KEYS.some((key) => {
    const entry = config[key];
    if (!entry) return false;

    if (entry.mode === "text") {
      return Boolean(entry.text?.trim());
    }

    if (entry.mode === "fixed") {
      return Boolean(normalizeTime(entry.fixed));
    }

    return (entry.offsetMinutes ?? 0) !== 0;
  });
}

export function hasNonZeroAdhanOffsets(config: DailyAdhanConfig) {
  return hasAdhanOverrides(config);
}

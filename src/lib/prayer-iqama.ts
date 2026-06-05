export type DailyPrayerKey = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

export type IqamaMode = "fixed" | "interval" | "text" | "follows_magrib";

export const DAILY_PRAYER_KEYS: DailyPrayerKey[] = [
  "fajr",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
];

export const FOLLOWS_MAGHRIB_LABEL = "After Maghrib";

export const IQAMA_DEFAULT_INTERVAL = 15;

export interface PrayerIqamaConfig {
  mode: IqamaMode;
  fixed?: string;
  /** @deprecated Prefer intervalText */
  intervalMinutes?: number;
  intervalText?: string;
  text?: string;
}

export type DailyIqamaConfig = Partial<Record<DailyPrayerKey, PrayerIqamaConfig>>;

export interface ResolvedPrayerSlot {
  adhan: string | null;
  iqama: string | null;
  iqamaDisplay: string | null;
}

const TIME_PATTERN = /^\d{2}:\d{2}$/;

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

export function parseIntervalMinutes(config: PrayerIqamaConfig): number {
  const raw = config.intervalText?.trim();
  if (raw) {
    const match = raw.match(/\d+/);
    if (match) return Number(match[0]);
  }

  if (
    typeof config.intervalMinutes === "number" &&
    !Number.isNaN(config.intervalMinutes)
  ) {
    return config.intervalMinutes;
  }

  return IQAMA_DEFAULT_INTERVAL;
}

export function getIntervalTextValue(config: PrayerIqamaConfig): string {
  if (config.intervalText?.trim()) return config.intervalText.trim();
  if (typeof config.intervalMinutes === "number") {
    return String(config.intervalMinutes);
  }
  return String(IQAMA_DEFAULT_INTERVAL);
}

export function defaultIqamaConfig(): DailyIqamaConfig {
  return Object.fromEntries(
    DAILY_PRAYER_KEYS.map((key) => [
      key,
      { mode: "interval" as const, intervalText: String(IQAMA_DEFAULT_INTERVAL) },
    ])
  ) as DailyIqamaConfig;
}

export function defaultIqamaConfigEntry(): PrayerIqamaConfig {
  return { mode: "interval", intervalText: String(IQAMA_DEFAULT_INTERVAL) };
}

export function parseDailyIqamaConfig(value: unknown): DailyIqamaConfig | null {
  if (!value || typeof value !== "object") return null;

  const parsed: DailyIqamaConfig = {};

  for (const key of DAILY_PRAYER_KEYS) {
    const entry = (value as Record<string, unknown>)[key];
    if (!entry || typeof entry !== "object") continue;

    const mode = (entry as PrayerIqamaConfig).mode;
    if (
      mode !== "fixed" &&
      mode !== "interval" &&
      mode !== "text" &&
      mode !== "follows_magrib"
    ) {
      continue;
    }

    parsed[key] = {
      mode,
      fixed:
        typeof (entry as PrayerIqamaConfig).fixed === "string"
          ? (entry as PrayerIqamaConfig).fixed
          : undefined,
      intervalMinutes:
        typeof (entry as PrayerIqamaConfig).intervalMinutes === "number"
          ? (entry as PrayerIqamaConfig).intervalMinutes
          : undefined,
      intervalText:
        typeof (entry as PrayerIqamaConfig).intervalText === "string"
          ? (entry as PrayerIqamaConfig).intervalText
          : undefined,
      text:
        typeof (entry as PrayerIqamaConfig).text === "string"
          ? (entry as PrayerIqamaConfig).text
          : undefined,
    };
  }

  return Object.keys(parsed).length > 0 ? parsed : null;
}

export function inferIqamaConfigFromLegacy(
  legacyIqama: string | null | undefined,
  stored?: PrayerIqamaConfig
): PrayerIqamaConfig {
  if (stored) return stored;

  const value = legacyIqama?.trim();
  if (!value) {
    return defaultIqamaConfigEntry();
  }

  if (TIME_PATTERN.test(value)) {
    return { mode: "fixed", fixed: value };
  }

  if (/maghrib/i.test(value)) {
    return { mode: "follows_magrib" };
  }

  return { mode: "text", text: value };
}

export function buildDailyIqamaConfigFromOverride(
  override: Partial<Record<`${DailyPrayerKey}Iqama`, string | null>> & {
    iqamaConfig?: unknown;
  }
): DailyIqamaConfig {
  const stored = parseDailyIqamaConfig(override.iqamaConfig);
  const config: DailyIqamaConfig = {};

  for (const key of DAILY_PRAYER_KEYS) {
    const legacyKey = `${key}Iqama` as const;
    config[key] = inferIqamaConfigFromLegacy(
      override[legacyKey] ?? null,
      stored?.[key]
    );
  }

  return config;
}

export function resolvePrayerSlotWithIqama(
  adhan: string | null | undefined,
  config: PrayerIqamaConfig | undefined,
  options?: {
    legacyIqama?: string | null;
    deriveDefault?: boolean;
    maghribSlot?: ResolvedPrayerSlot | null;
  }
): ResolvedPrayerSlot {
  const normalizedAdhan = normalizeTime(adhan);
  const resolvedConfig =
    config ?? inferIqamaConfigFromLegacy(options?.legacyIqama, undefined);

  switch (resolvedConfig.mode) {
    case "fixed": {
      const iqama = normalizeTime(resolvedConfig.fixed ?? options?.legacyIqama);
      return {
        adhan: normalizedAdhan,
        iqama,
        iqamaDisplay: iqama,
      };
    }
    case "interval": {
      const minutes = parseIntervalMinutes(resolvedConfig);
      const iqama = normalizedAdhan
        ? addMinutesToTime(normalizedAdhan, minutes)
        : null;
      return {
        adhan: normalizedAdhan,
        iqama,
        iqamaDisplay: iqama,
      };
    }
    case "text": {
      const text = resolvedConfig.text?.trim() || options?.legacyIqama || "—";
      return {
        adhan: normalizedAdhan,
        iqama: null,
        iqamaDisplay: text,
      };
    }
    case "follows_magrib": {
      const maghribIqama = options?.maghribSlot?.iqama;
      const maghribDisplay = options?.maghribSlot?.iqamaDisplay;
      return {
        adhan: normalizedAdhan,
        iqama: maghribIqama ?? null,
        iqamaDisplay: maghribDisplay ?? FOLLOWS_MAGHRIB_LABEL,
      };
    }
    default: {
      const iqama =
        normalizeTime(options?.legacyIqama) ??
        (options?.deriveDefault !== false && normalizedAdhan
          ? addMinutesToTime(normalizedAdhan, IQAMA_DEFAULT_INTERVAL)
          : null);

      return {
        adhan: normalizedAdhan,
        iqama,
        iqamaDisplay: iqama,
      };
    }
  }
}

export function legacyIqamaValueFromConfig(config: PrayerIqamaConfig): string | null {
  switch (config.mode) {
    case "fixed":
      return normalizeTime(config.fixed);
    case "interval":
      return null;
    case "text":
      return config.text?.trim() || null;
    case "follows_magrib":
      return FOLLOWS_MAGHRIB_LABEL;
    default:
      return null;
  }
}

export function formatIqamaDisplay(slot: ResolvedPrayerSlot) {
  if (slot.iqamaDisplay) return slot.iqamaDisplay;
  if (slot.iqama) return slot.iqama;
  return "—";
}

export function legacyIqamaFieldsFromConfig(
  config: DailyIqamaConfig
): Partial<Record<`${DailyPrayerKey}Iqama`, string | null>> {
  const fields: Partial<Record<`${DailyPrayerKey}Iqama`, string | null>> = {};

  for (const key of DAILY_PRAYER_KEYS) {
    const entry = config[key];
    if (!entry) continue;
    fields[`${key}Iqama`] = legacyIqamaValueFromConfig(entry);
  }

  return fields;
}

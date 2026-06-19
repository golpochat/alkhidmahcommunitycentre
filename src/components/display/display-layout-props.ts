import type { CachedAyah } from "@/lib/display-cache";
import type { WeatherPayload } from "@/lib/display-types";
import type { SerializedDisplaySettings } from "@/lib/display-settings";
import type { SerializedEvent } from "@/lib/events";
import type { RotationMessage } from "@/lib/rotation-client";
import type { SeasonalFlags } from "@/lib/seasonal-types";
import type { PrayerTimesResponse } from "@/lib/prayer-times-client";

export interface DisplayTodayResponse {
  schedule: PrayerTimesResponse;
  seasonal: SeasonalFlags;
  weather: WeatherPayload;
  fetchedAt: string;
}

export interface DisplayLayoutProps {
  schedule: PrayerTimesResponse;
  seasonal: SeasonalFlags;
  rotationMessages: RotationMessage[];
  events: SerializedEvent[];
  ayat: CachedAyah[];
  weather: WeatherPayload;
  settings: SerializedDisplaySettings;
  now: Date | null;
}

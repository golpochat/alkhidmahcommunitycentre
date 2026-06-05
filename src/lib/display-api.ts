import "server-only";

import { unstable_cache } from "next/cache";
import { format } from "date-fns";
import { db } from "@/lib/db";
import { serializeEvent } from "@/lib/events";
import { getPrayerTimesForDisplay } from "@/lib/prayer-times";
import {
  ensureDisplaySettings,
  serializeDisplaySettings,
} from "@/lib/display-settings";
import {
  getAllRotatingAyat,
  getAyatCache,
  setAyatCache,
} from "@/lib/display-cache";
import { getSeasonalFlags } from "@/lib/seasonal";
import { CLONDLAKIN_COORDS } from "@/lib/constants";

import type { SerializedDisplayNotice, WeatherPayload } from "@/lib/display-types";

export type { SerializedDisplayNotice, WeatherPayload } from "@/lib/display-types";

import { DEFAULT_DISPLAY_ROTATION } from "@/lib/display-rotation-content";

export const DISPLAY_PRAYER_TIMES_CACHE_TAG = "display-prayer-times";

export const getCachedPrayerTimesForDisplay = unstable_cache(
  async () => getPrayerTimesForDisplay(),
  ["display-prayer-times"],
  { revalidate: 60, tags: [DISPLAY_PRAYER_TIMES_CACHE_TAG] }
);

export async function getDisplayTodayPayload() {
  const [schedule, seasonal, weather] = await Promise.all([
    getCachedPrayerTimesForDisplay(),
    getCachedPrayerTimesForDisplay().then((data) => getSeasonalFlags(data)),
    getCachedWeather(),
  ]);

  return {
    schedule,
    seasonal,
    weather,
    fetchedAt: new Date().toISOString(),
  };
}

function isNoticeActive(
  notice: {
    startDate: Date | null;
    endDate: Date | null;
  },
  now: Date
) {
  if (notice.startDate && notice.startDate > now) return false;
  if (notice.endDate && notice.endDate < now) return false;
  return true;
}

export function serializeDisplayNotice(
  notice: Awaited<ReturnType<typeof db.displayNotice.findMany>>[number]
): SerializedDisplayNotice {
  return {
    id: notice.id,
    title: notice.title,
    message: notice.message,
    priority: notice.priority,
    startDate: notice.startDate ? notice.startDate.toISOString() : null,
    endDate: notice.endDate ? notice.endDate.toISOString() : null,
    createdAt: notice.createdAt.toISOString(),
  };
}

export async function getActiveDisplayNotices() {
  const notices = await db.displayNotice.findMany({
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
  });

  const now = new Date();
  return notices
    .filter((notice) => isNoticeActive(notice, now))
    .map(serializeDisplayNotice);
}

export async function getUpcomingDisplayEvents(limit = 3) {
  const now = new Date();
  const events = await db.event.findMany({
    where: {
      published: true,
      startAt: { gte: now },
    },
    orderBy: { startAt: "asc" },
    take: limit,
  });

  return events.map(serializeEvent);
}

async function loadAyatFromDb() {
  const items = await db.ayahRotation.findMany({
    orderBy: { createdAt: "asc" },
  });

  if (!items.length) {
    await db.ayahRotation.createMany({ data: DEFAULT_DISPLAY_ROTATION });
    return db.ayahRotation.findMany({ orderBy: { createdAt: "asc" } });
  }

  return items;
}

export async function refreshAyatCache() {
  const items = await loadAyatFromDb();
  setAyatCache(items);
  return items;
}

export async function getDisplayAyat() {
  if (!getAyatCache().length) {
    await refreshAyatCache();
  }

  return getAllRotatingAyat();
}

export async function getDisplaySettingsPayload() {
  const settings = await ensureDisplaySettings();
  return serializeDisplaySettings(settings);
}

const WEATHER_DESCRIPTIONS: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Foggy",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Rain showers",
  95: "Thunderstorm",
};

export const getCachedWeather = unstable_cache(
  async (): Promise<WeatherPayload> => {
    try {
      const url = new URL("https://api.open-meteo.com/v1/forecast");
      url.searchParams.set("latitude", String(CLONDLAKIN_COORDS.latitude));
      url.searchParams.set("longitude", String(CLONDLAKIN_COORDS.longitude));
      url.searchParams.set(
        "current",
        "temperature_2m,weather_code,wind_speed_10m"
      );
      url.searchParams.set("timezone", "Europe/Dublin");

      const response = await fetch(url.toString(), {
        next: { revalidate: 600 },
      });

      if (!response.ok) {
        throw new Error("Weather fetch failed");
      }

      const data = await response.json();
      const current = data.current ?? {};
      const code = current.weather_code ?? null;

      return {
        temperature: current.temperature_2m ?? null,
        weatherCode: code,
        windSpeed: current.wind_speed_10m ?? null,
        description: code != null ? WEATHER_DESCRIPTIONS[code] ?? "Current conditions" : "Current conditions",
      };
    } catch {
      return {
        temperature: null,
        weatherCode: null,
        windSpeed: null,
        description: "Weather unavailable",
      };
    }
  },
  ["display-weather"],
  { revalidate: 600 }
);

export async function expireDisplayNotices() {
  const now = new Date();
  const expired = await db.displayNotice.findMany({
    where: {
      endDate: { lt: now },
    },
  });

  return {
    expiredCount: expired.length,
    checkedAt: format(now, "yyyy-MM-dd'T'HH:mm:ss"),
  };
}

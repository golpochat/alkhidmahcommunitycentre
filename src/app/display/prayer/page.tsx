import { PrayerDisplayScreen } from "@/components/display/prayer-display-screen";
import {
  getActiveDisplayNotices,
  getCachedWeather,
  getDisplayAyat,
  getDisplayTodayPayload,
} from "@/lib/display-api";
import { getDisplaySettingsPayload } from "@/lib/display-api";
import { getUpcomingDisplayEvents } from "@/lib/display-api";

export const revalidate = 60;

export default async function PrayerDisplayPage() {
  const [today, notices, events, ayat, weather, settings] = await Promise.all([
    getDisplayTodayPayload(),
    getActiveDisplayNotices(),
    getUpcomingDisplayEvents(3),
    getDisplayAyat(),
    getCachedWeather(),
    getDisplaySettingsPayload(),
  ]);

  return (
    <PrayerDisplayScreen
      initialToday={today}
      initialNotices={notices}
      initialEvents={events}
      initialAyat={ayat}
      initialWeather={weather}
      initialSettings={settings}
    />
  );
}

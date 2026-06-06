import { DisplayRouter } from "@/app/display/prayer/display-router";
import {
  getActiveDisplayNotices,
  getCachedWeather,
  getDisplayAyat,
  getDisplaySettingsPayload,
  getDisplayTodayPayload,
  getUpcomingDisplayEvents,
} from "@/lib/display-api";

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
    <DisplayRouter
      initialToday={today}
      initialNotices={notices}
      initialEvents={events}
      initialAyat={ayat}
      initialWeather={weather}
      initialSettings={settings}
    />
  );
}

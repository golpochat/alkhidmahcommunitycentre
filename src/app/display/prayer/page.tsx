import { DisplayRouter } from "@/app/display/prayer/display-router";
import {
  getCachedWeather,
  getDisplayAyat,
  getDisplaySettingsPayload,
  getDisplayTodayPayload,
  getUpcomingDisplayEvents,
} from "@/lib/display-api";
import { getRotationQueue } from "@/lib/message-rotation";
import type { RotationMessage } from "@/lib/rotation-client";

function mapInitialRotationMessages(
  messages: Awaited<ReturnType<typeof getRotationQueue>>,
): RotationMessage[] {
  return messages.map((message) => ({
    id: message.id,
    title: message.title,
    body: message.body,
    state: message.state,
    durationSeconds: message.durationSeconds,
  }));
}

export const revalidate = 60;

export default async function PrayerDisplayPage() {
  const [today, rotationQueue, events, ayat, weather, settings] =
    await Promise.all([
      getDisplayTodayPayload(),
      getRotationQueue(),
      getUpcomingDisplayEvents(3),
      getDisplayAyat(),
      getCachedWeather(),
      getDisplaySettingsPayload(),
    ]);

  return (
    <DisplayRouter
      initialToday={today}
      initialRotationMessages={mapInitialRotationMessages(rotationQueue)}
      initialEvents={events}
      initialAyat={ayat}
      initialWeather={weather}
      initialSettings={settings}
    />
  );
}

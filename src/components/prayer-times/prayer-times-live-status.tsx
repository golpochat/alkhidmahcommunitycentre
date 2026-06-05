"use client";

import { useEffect, useState } from "react";
import {
  findNextPrayer,
  formatCountdown,
  formatLiveClock,
  formatNextPrayerCountdownLabel,
  getCountdownToNextPrayer,
  type PrayerTimesResponse,
} from "@/lib/prayer-times-client";

/** Live clock that avoids SSR/client hydration mismatches. */
function useLiveNow() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return now;
}

interface PrayerTimesClockHeaderProps {
  englishDate: string | null;
  hijriDate: string | null;
}

export function PrayerTimesClockHeader({
  englishDate,
  hijriDate,
}: PrayerTimesClockHeaderProps) {
  const now = useLiveNow();

  return (
    <div className="prayer-times-clock-header">
      {englishDate && <p className="prayer-times-english-date">{englishDate}</p>}
      <p className="prayer-times-live-clock" aria-live="off">
        {now ? formatLiveClock(now) : "--:--:--"}
      </p>
      {hijriDate && <p className="prayer-times-hijri-date">{hijriDate}</p>}
    </div>
  );
}

interface PrayerTimesCountdownFooterProps {
  schedule: PrayerTimesResponse;
}

export function PrayerTimesCountdownFooter({ schedule }: PrayerTimesCountdownFooterProps) {
  const now = useLiveNow();
  if (!now) return null;

  const nextPrayer = findNextPrayer(schedule, now);
  if (!nextPrayer) return null;

  const countdownSeconds = getCountdownToNextPrayer(nextPrayer, now);
  if (countdownSeconds === null) return null;

  return (
    <div className="prayer-times-countdown-footer">
      <p className="prayer-times-countdown-label">
        {formatNextPrayerCountdownLabel(nextPrayer)}
      </p>
      <p className="prayer-times-countdown-timer">{formatCountdown(countdownSeconds)}</p>
    </div>
  );
}

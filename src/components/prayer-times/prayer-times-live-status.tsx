"use client";

import { useLiveNow } from "@/hooks/useLiveNow";
import {
  findNextPrayer,
  formatCountdown,
  formatLiveClock,
  formatNextPrayerCountdownLabel,
  getCountdownToNextPrayer,
  type PrayerTimesResponse,
} from "@/lib/prayer-times-client";

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

  const countdownSeconds = getCountdownToNextPrayer(nextPrayer, now, schedule);
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

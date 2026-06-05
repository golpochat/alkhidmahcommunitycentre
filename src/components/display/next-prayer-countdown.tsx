"use client";

import { useEffect, useState } from "react";
import type { SerializedDisplayNotice } from "@/lib/display-types";
import { resolveDisplayCountdown } from "@/lib/seasonal-client";
import type { SeasonalFlags } from "@/lib/seasonal-types";
import {
  formatCountdown,
  type PrayerTimesResponse,
} from "@/lib/prayer-times-client";

interface NextPrayerCountdownProps {
  schedule: PrayerTimesResponse;
  seasonal: SeasonalFlags;
  notices: SerializedDisplayNotice[];
}

export function NextPrayerCountdown({
  schedule,
  seasonal,
  notices,
}: NextPrayerCountdownProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!now) return null;

  const active = resolveDisplayCountdown(schedule, seasonal, notices, now);
  if (active.type === "none") return null;

  if (active.type === "emergency") {
    return (
      <section className="display-countdown-footer">
        <p className="display-countdown-footer-label">Important Notice</p>
        <p className="display-countdown-footer-title">{active.title}</p>
        <p className="display-countdown-footer-message">{active.message}</p>
      </section>
    );
  }

  if (active.type === "seasonal") {
    return (
      <section className="display-countdown-footer">
        <p className="display-countdown-footer-label">{active.countdown.label}</p>
        <p className="display-countdown-footer-time">
          {formatCountdown(active.countdown.seconds)}
        </p>
      </section>
    );
  }

  return (
    <section className="display-countdown-footer">
      <p className="display-countdown-footer-label">{active.label}</p>
      <p className="display-countdown-footer-time">
        {formatCountdown(active.seconds)}
      </p>
    </section>
  );
}

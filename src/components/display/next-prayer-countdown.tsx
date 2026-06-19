"use client";

import type { SerializedDisplayNotice } from "@/lib/display-types";
import {
  resolveDisplayCountdown,
} from "@/lib/seasonal-client";
import type { SeasonalFlags } from "@/lib/seasonal-types";
import {
  formatCountdown,
  type PrayerTimesResponse,
} from "@/lib/prayer-times-client";

interface NextPrayerCountdownProps {
  schedule: PrayerTimesResponse;
  seasonal: SeasonalFlags;
  notices: SerializedDisplayNotice[];
  now: Date | null;
  variant?: "default" | "large" | "landscape" | "portrait";
}

export function NextPrayerCountdown({
  schedule,
  seasonal,
  notices,
  now,
  variant = "default",
}: NextPrayerCountdownProps) {
  if (!now) return null;

  if (variant === "landscape" || variant === "portrait") {
    const active = resolveDisplayCountdown(
      schedule,
      seasonal,
      notices,
      now,
    );

    if (active.type === "none") return null;

    if (active.type === "emergency") {
      return (
        <section className="display-emergency-alert display-emergency-alert-bar">
          <p className="display-emergency-alert-label">Important Notice</p>
          <p className="display-emergency-alert-title">{active.title}</p>
          <p className="display-emergency-alert-message">{active.message}</p>
        </section>
      );
    }

    const seconds =
      active.type === "prayer" ? active.seconds : active.countdown.seconds;
    const label =
      active.type === "prayer" ? active.label : active.countdown.label;

    return (
      <section className="display-countdown-footer display-countdown-footer-landscape display-countdown-footer-bar">
        <p className="display-bottom-bar-label">{label}</p>
        <p className="display-bottom-bar-value">{formatCountdown(seconds)}</p>
      </section>
    );
  }

  const emergency = notices.find((notice) => notice.priority === "high");
  if (emergency) return null;
  if (seasonal.isRamadan) return null;

  const active = resolveDisplayCountdown(schedule, seasonal, notices, now);
  if (active.type !== "prayer") return null;

  const sectionClass =
    variant === "large"
      ? "display-countdown-footer display-countdown-footer-large"
      : "display-countdown-footer";

  return (
    <section className={sectionClass}>
      <p className="display-countdown-footer-label">{active.label}</p>
      <p className="display-countdown-footer-time">
        {formatCountdown(active.seconds)}
      </p>
    </section>
  );
}

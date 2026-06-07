"use client";

import type { SerializedDisplayNotice } from "@/lib/display-types";
import { resolveDisplayCountdown } from "@/lib/seasonal-client";
import type { SeasonalFlags } from "@/lib/seasonal-types";
import {
  formatCountdown,
  type PrayerTimesResponse,
} from "@/lib/prayer-times-client";
import { CountdownRing } from "@/components/display/countdown-ring";

interface DisplayPriorityCountdownProps {
  schedule: PrayerTimesResponse;
  seasonal: SeasonalFlags;
  notices: SerializedDisplayNotice[];
  now: Date | null;
  variant?: "default" | "large";
}

export function DisplayPriorityCountdown({
  schedule,
  seasonal,
  notices,
  now,
  variant = "default",
}: DisplayPriorityCountdownProps) {
  if (!now) return null;

  const active = resolveDisplayCountdown(schedule, seasonal, notices, now);

  if (active.type === "none" || active.type === "prayer") {
    return null;
  }

  if (active.type === "emergency") {
    return (
      <section className="display-emergency-alert">
        <p className="display-emergency-alert-label">Important Notice</p>
        <p className="display-emergency-alert-title">{active.title}</p>
        <p className="display-emergency-alert-message">{active.message}</p>
      </section>
    );
  }

  const largeClass =
    variant === "large" ? " display-priority-countdown-large" : "";

  return (
    <section className={`display-priority-countdown${largeClass}`}>
      <CountdownRing
        seconds={active.countdown.seconds}
        totalSeconds={active.totalSeconds}
        label={active.countdown.label}
      />
      <p className="display-countdown-footer-time">
        {formatCountdown(active.countdown.seconds)}
      </p>
    </section>
  );
}

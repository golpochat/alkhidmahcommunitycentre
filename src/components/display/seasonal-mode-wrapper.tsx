"use client";

import type { ReactNode } from "react";
import { getDisplayEffectiveNow } from "@/lib/display-time";
import { shouldShowJumuahCountdown } from "@/lib/seasonal-client";
import type { SeasonalFlags } from "@/lib/seasonal-types";
import type { PrayerTimesResponse } from "@/lib/prayer-times-client";

interface SeasonalModeWrapperProps {
  seasonal: SeasonalFlags;
  schedule: PrayerTimesResponse;
  now: Date | null;
  children: ReactNode;
}

export function SeasonalModeWrapper({
  seasonal,
  schedule,
  now,
  children,
}: SeasonalModeWrapperProps) {
  const effectiveNow = getDisplayEffectiveNow(schedule, now);
  const showJumuahBanner = shouldShowJumuahCountdown(schedule, effectiveNow);

  const modeClass = seasonal.isEid
    ? "display-mode-eid"
    : seasonal.isRamadan
      ? "display-mode-ramadan"
      : showJumuahBanner
        ? "display-mode-jumuah"
        : "display-mode-default";

  return (
    <div className={`display-seasonal-wrapper ${modeClass}`}>
      {children}
    </div>
  );
}

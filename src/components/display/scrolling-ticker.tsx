"use client";

import { filterActiveDisplayNotices } from "@/lib/display-notices";
import type { SerializedDisplayNotice } from "@/lib/display-types";

interface ScrollingTickerProps {
  notices: SerializedDisplayNotice[];
  now?: Date | null;
}

export function ScrollingTicker({ notices, now = null }: ScrollingTickerProps) {
  const effectiveNow = now ?? new Date();
  const highPriority = filterActiveDisplayNotices(notices, effectiveNow).filter(
    (notice) => notice.priority === "high",
  );

  if (!highPriority.length) return null;

  const items = highPriority.flatMap((notice) => [notice.title, notice.message]);
  const tickerText = items.join("  •  ");

  return (
    <footer className="display-scrolling-ticker">
      <div className="display-scrolling-ticker-line" />
      <div className="display-scrolling-ticker-track">
        <p className="display-scrolling-ticker-text">{tickerText}</p>
        <p className="display-scrolling-ticker-text" aria-hidden="true">
          {tickerText}
        </p>
      </div>
    </footer>
  );
}

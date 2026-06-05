"use client";

import { useEffect, useState } from "react";
import { formatLiveClock } from "@/lib/prayer-times-client";

interface DisplayClockProps {
  englishDate: string | null;
  hijriDate: string | null;
}

export function DisplayClock({ englishDate, hijriDate }: DisplayClockProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="display-clock">
      <div className="display-clock-dates">
        {englishDate && (
          <p className="display-clock-english">{englishDate}</p>
        )}
        {hijriDate && <p className="display-clock-hijri">{hijriDate}</p>}
      </div>
      <p className="display-clock-time">{formatLiveClock(now)}</p>
    </header>
  );
}

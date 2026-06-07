"use client";

import { useEffect, useState } from "react";
import { formatLiveClock } from "@/lib/prayer-times-client";

interface DisplayDatesProps {
  englishDate: string | null;
  hijriDate: string | null;
  className?: string;
}

export function DisplayDates({
  englishDate,
  hijriDate,
  className = "",
}: DisplayDatesProps) {
  return (
    <div className={`display-clock-dates${className ? ` ${className}` : ""}`}>
      {englishDate && <p className="display-clock-english">{englishDate}</p>}
      {hijriDate && <p className="display-clock-hijri">{hijriDate}</p>}
    </div>
  );
}

interface DisplayLiveTimeProps {
  className?: string;
}

export function DisplayLiveTime({ className = "" }: DisplayLiveTimeProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <p
      className={className ?? "display-clock-time"}
      aria-live="off"
    >
      {now ? formatLiveClock(now) : "--:--:--"}
    </p>
  );
}

interface DisplayClockProps {
  englishDate: string | null;
  hijriDate: string | null;
}

export function DisplayClock({ englishDate, hijriDate }: DisplayClockProps) {
  return (
    <header className="display-clock">
      <DisplayDates englishDate={englishDate} hijriDate={hijriDate} />
      <DisplayLiveTime />
    </header>
  );
}

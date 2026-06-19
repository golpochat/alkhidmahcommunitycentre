"use client";

import { useEffect, useState } from "react";

interface CountdownRingProps {
  seconds: number;
  totalSeconds?: number;
  label: string;
  variant?: "default" | "landscape" | "portrait";
}

export function CountdownRing({
  seconds,
  totalSeconds = 3600,
  label,
  variant = "default",
}: CountdownRingProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(1, Math.max(0, seconds / totalSeconds));
  const offset = mounted ? circumference * (1 - progress) : circumference;

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const showHours = hours > 0;
  const display = mounted
    ? showHours
      ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
      : `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
    : "--:--";

  const timeClass = showHours
    ? "display-countdown-ring-time display-countdown-ring-time-hms"
    : "display-countdown-ring-time";

  const ringClass =
    variant === "landscape" || variant === "portrait"
      ? `display-countdown-ring display-countdown-ring-display display-countdown-ring-${variant}`
      : "display-countdown-ring";

  return (
    <div className={ringClass}>
      <svg className="display-countdown-ring-svg" viewBox="0 0 200 200">
        <circle
          className="display-countdown-ring-track"
          cx="100"
          cy="100"
          r={radius}
        />
        <circle
          className="display-countdown-ring-progress"
          cx="100"
          cy="100"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="display-countdown-ring-content">
        <p className="display-countdown-ring-label">{label}</p>
        <p className={timeClass}>{display}</p>
      </div>
    </div>
  );
}

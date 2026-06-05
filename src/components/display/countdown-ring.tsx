"use client";

interface CountdownRingProps {
  seconds: number;
  totalSeconds?: number;
  label: string;
}

export function CountdownRing({
  seconds,
  totalSeconds = 3600,
  label,
}: CountdownRingProps) {
  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(1, Math.max(0, seconds / totalSeconds));
  const offset = circumference * (1 - progress);

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const display =
    hours > 0
      ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
      : `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return (
    <div className="display-countdown-ring">
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
        <p className="display-countdown-ring-time">{display}</p>
      </div>
    </div>
  );
}

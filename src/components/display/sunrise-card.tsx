import { formatPrayerTime24h } from "@/lib/prayer-times-client";

interface SunriseCardProps {
  time: string | null;
  isNext?: boolean;
}

export function SunriseCard({ time, isNext }: SunriseCardProps) {
  return (
    <article
      className={`display-prayer-card${isNext ? " display-prayer-card-next" : ""}`}
    >
      <h3 className="display-prayer-card-name">Sunrise</h3>
      <div className="display-prayer-card-times">
        <div className="display-prayer-card-time-block">
          <span className="display-prayer-card-time-value display-prayer-card-sunrise-time">
            {formatPrayerTime24h(time)}
          </span>
        </div>
      </div>
    </article>
  );
}

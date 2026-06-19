import { formatPrayerTime24h } from "@/lib/prayer-times-client";

interface DisplayBottomBarSunriseProps {
  time: string | null;
}

export function DisplayBottomBarSunrise({ time }: DisplayBottomBarSunriseProps) {
  if (!time) return null;

  return (
    <aside className="display-bottom-bar-sunrise-block" aria-label="Sunrise">
      <p className="display-bottom-bar-label">Sunrise</p>
      <p className="display-bottom-bar-value">
        {formatPrayerTime24h(time)}
      </p>
    </aside>
  );
}

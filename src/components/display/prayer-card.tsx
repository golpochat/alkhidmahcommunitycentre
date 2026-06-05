import { formatPrayerTime24h } from "@/lib/prayer-times-client";

interface PrayerCardProps {
  name: string;
  adhan: string | null;
  iqama: string | null;
  iqamaDisplay?: string | null;
  isActive?: boolean;
  isNext?: boolean;
  showDivider?: boolean;
}

export function PrayerCard({
  name,
  adhan,
  iqama,
  iqamaDisplay,
  isActive,
  isNext,
  showDivider,
}: PrayerCardProps) {
  const iqamaTime = iqamaDisplay ?? iqama;

  return (
    <article
      className={`display-prayer-card${isNext ? " display-prayer-card-next" : ""}${isActive ? " display-prayer-card-active" : ""}${showDivider ? " display-prayer-card-divider" : ""}`}
    >
      <h3 className="display-prayer-card-name">{name}</h3>
      <div className="display-prayer-card-times">
        <div className="display-prayer-card-time-block">
          <span className="display-prayer-card-time-label">Adhan</span>
          <span className="display-prayer-card-time-value">
            {formatPrayerTime24h(adhan)}
          </span>
        </div>
        <div className="display-prayer-card-time-block">
          <span className="display-prayer-card-time-label">Iqamah</span>
          <span className="display-prayer-card-time-value display-prayer-card-iqama">
            {formatPrayerTime24h(iqamaTime)}
          </span>
        </div>
      </div>
    </article>
  );
}

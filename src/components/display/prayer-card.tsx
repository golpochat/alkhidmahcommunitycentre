import { formatPrayerTime24h } from "@/lib/prayer-times-client";

interface PrayerCardProps {
  name: string;
  adhan: string | null;
  iqama: string | null;
  adhanDisplay?: string | null;
  iqamaDisplay?: string | null;
  iqamaLabel?: string | null;
  combinedNote?: string | null;
  isActive?: boolean;
  isNext?: boolean;
}

export function PrayerCard({
  name,
  adhan,
  iqama,
  adhanDisplay,
  iqamaDisplay,
  iqamaLabel,
  combinedNote,
  isActive,
  isNext,
}: PrayerCardProps) {
  const iqamaTime = iqamaDisplay ?? iqama;
  const showIqamah = Boolean(iqamaLabel || iqamaTime);
  const adhanLabel = adhanDisplay?.trim() || formatPrayerTime24h(adhan);

  return (
    <article
      className={`display-prayer-card${isNext ? " display-prayer-card-next" : ""}${isActive ? " display-prayer-card-active" : ""}`}
    >
      <h3 className="display-prayer-card-name">{name}</h3>
      <div className="display-prayer-card-times">
        <div className="display-prayer-card-time-block">
          <span className="display-prayer-card-time-label">Adhan</span>
          <span className="display-prayer-card-time-value">{adhanLabel}</span>
        </div>
        {showIqamah && (
          <div className="display-prayer-card-time-block">
            <span className="display-prayer-card-time-label">Iqamah</span>
            <span
              className={`display-prayer-card-time-value display-prayer-card-iqama${iqamaLabel ? " display-prayer-card-iqama-label" : ""}`}
            >
              {iqamaLabel ?? formatPrayerTime24h(iqamaTime)}
            </span>
          </div>
        )}
        {combinedNote && (
          <p className="display-prayer-card-combined-note">{combinedNote}</p>
        )}
      </div>
    </article>
  );
}

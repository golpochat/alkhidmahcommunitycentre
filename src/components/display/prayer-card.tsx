import { formatPrayerTime24h } from "@/lib/prayer-times-client";

interface PrayerCardProps {
  name: string;
  adhan: string | null;
  iqama: string | null;
  iqamaDisplay?: string | null;
  variant?: "default" | "sunrise";
  isActive?: boolean;
  isNext?: boolean;
  showDivider?: boolean;
}

export function PrayerCard({
  name,
  adhan,
  iqama,
  iqamaDisplay,
  variant = "default",
  isActive,
  isNext,
  showDivider,
}: PrayerCardProps) {
  const iqamaTime = iqamaDisplay ?? iqama;
  const showIqamah = variant !== "sunrise" && Boolean(iqamaTime);

  return (
    <article
      className={`display-prayer-card${isNext ? " display-prayer-card-next" : ""}${isActive ? " display-prayer-card-active" : ""}${showDivider ? " display-prayer-card-divider" : ""}${variant === "sunrise" ? " display-prayer-card-sunrise" : ""}`}
    >
      <h3 className="display-prayer-card-name">{name}</h3>
      <div className="display-prayer-card-times">
        <div className="display-prayer-card-time-block">
          {variant !== "sunrise" && (
            <span className="display-prayer-card-time-label">Adhan</span>
          )}
          <span className="display-prayer-card-time-value">
            {formatPrayerTime24h(adhan)}
          </span>
        </div>
        {showIqamah && (
          <div className="display-prayer-card-time-block">
            <span className="display-prayer-card-time-label">Iqamah</span>
            <span className="display-prayer-card-time-value display-prayer-card-iqama">
              {formatPrayerTime24h(iqamaTime)}
            </span>
          </div>
        )}
      </div>
    </article>
  );
}

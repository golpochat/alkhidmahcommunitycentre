import {
  formatJamaahLabel,
  formatPrayerTime24h,
} from "@/lib/prayer-times-client";

interface JumuahSlotDisplay {
  index: number;
  adhan: string | null;
  iqama: string | null;
}

interface JumuahCardProps {
  slots: JumuahSlotDisplay[];
  isNext?: boolean;
  showDivider?: boolean;
}

export function JumuahCard({ slots, isNext, showDivider }: JumuahCardProps) {
  return (
    <article
      className={`display-prayer-card display-jumuah-card${isNext ? " display-prayer-card-next" : ""}${showDivider ? " display-prayer-card-divider" : ""}`}
    >
      <h3 className="display-prayer-card-name">Jumu&apos;ah</h3>
      <ul className="display-jumuah-card-list">
        {slots.map((slot) => (
          <li key={slot.index} className="display-jumuah-card-row">
            <span className="display-jumuah-card-label">
              {formatJamaahLabel(slot.index)}
            </span>
            <span className="display-jumuah-card-times">
              <span>Adhan {formatPrayerTime24h(slot.adhan)}</span>
              {slot.iqama && (
                <>
                  <span className="display-jumuah-card-separator">|</span>
                  <span>Iqamah {formatPrayerTime24h(slot.iqama)}</span>
                </>
              )}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}

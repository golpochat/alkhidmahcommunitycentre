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
  isActive?: boolean;
}

export function JumuahCard({ slots, isNext, isActive }: JumuahCardProps) {
  return (
    <article
      className={`display-prayer-card display-jumuah-card${isNext ? " display-prayer-card-next" : ""}${isActive ? " display-prayer-card-active" : ""}`}
    >
      <h3 className="display-jumuah-card-heading">Jumu&apos;ah Prayers</h3>
      <ul className="display-jumuah-card-list">
        {slots.map((slot) => (
          <li key={slot.index} className="display-jumuah-card-row">
            {formatJamaahLabel(slot.index)} —{" "}
            {formatPrayerTime24h(slot.iqama ?? slot.adhan)}
          </li>
        ))}
      </ul>
    </article>
  );
}

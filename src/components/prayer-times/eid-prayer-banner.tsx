import { format, parseISO } from "date-fns";
import {
  formatPrayerTime12h,
  getEidPrayerLabel,
  getEidPrayerTime,
  getEidShortName,
  type EidInfo,
} from "@/lib/prayer-times-client";

interface EidPrayerBannerProps {
  eid: EidInfo;
  compact?: boolean;
}

export function EidPrayerBanner({
  eid,
  compact = false,
}: EidPrayerBannerProps) {
  if (!eid.type || eid.prayers.length === 0) return null;

  const eidYear = eid.date
    ? format(parseISO(eid.date), "yyyy")
    : format(new Date(), "yyyy");

  return (
    <div className={compact ? "eid-prayer-banner mb-6" : "eid-prayer-banner"}>
      <div className="eid-prayer-banner-header">
        <h3 className="eid-prayer-banner-title">
          {getEidShortName(eid.type)} {eidYear}
        </h3>
        <p className="eid-prayer-banner-greeting">Eid Mubarak</p>
      </div>
      {eid.date && (
        <p className="eid-prayer-banner-date">
          {format(parseISO(eid.date), "EEEE, d MMMM yyyy")}
        </p>
      )}
      <div className="space-y-1">
        {eid.prayers.map((prayer) => (
          <div key={prayer.index} className="eid-prayer-banner-row">
            <span className="font-medium">
              {getEidPrayerLabel(prayer.index)}
            </span>
            <strong className="font-heading">
              {formatPrayerTime12h(getEidPrayerTime(prayer))}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}

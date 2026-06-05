import type { SeasonalFlags } from "@/lib/seasonal-types";
import { getEidShortName, type PrayerTimesResponse } from "@/lib/prayer-times-client";

export interface SeasonalPanelMessage {
  title: string;
  message: string;
  variant: "eid" | "ramadan" | "jumuah";
}

export function getSeasonalPanelMessage(
  seasonal: SeasonalFlags,
  schedule: PrayerTimesResponse,
  showJumuahBanner: boolean
): SeasonalPanelMessage | null {
  if (seasonal.isEid && schedule.eid.type) {
    return {
      title: `Eid Mubarak — ${getEidShortName(schedule.eid.type)}`,
      message: "May Allah accept your worship and bless our community",
      variant: "eid",
    };
  }

  if (seasonal.isRamadan && seasonal.ramadanDay) {
    return {
      title: `Ramadan Kareem — Day ${seasonal.ramadanDay}`,
      message:
        seasonal.ramadanDaysRemaining != null
          ? `${seasonal.ramadanDaysRemaining} days remaining`
          : "May Allah accept our fasting and worship",
      variant: "ramadan",
    };
  }

  if (showJumuahBanner) {
    return {
      title: "Jumu'ah Mubarak",
      message: "Remember to arrive early for khutbah",
      variant: "jumuah",
    };
  }

  return null;
}

interface SeasonalPanelMessageBlockProps {
  message: SeasonalPanelMessage;
}

export function SeasonalPanelMessageBlock({
  message,
}: SeasonalPanelMessageBlockProps) {
  return (
    <div
      className={`display-seasonal-panel-message display-seasonal-panel-message-${message.variant}`}
    >
      <p className="display-seasonal-panel-message-title">{message.title}</p>
      <p className="display-seasonal-panel-message-text">{message.message}</p>
    </div>
  );
}

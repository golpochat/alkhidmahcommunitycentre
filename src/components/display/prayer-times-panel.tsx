"use client";

import type { ReactNode } from "react";
import { JumuahCard } from "@/components/display/jumuah-card";
import { PrayerCard } from "@/components/display/prayer-card";
import { getDisplayEffectiveNow } from "@/lib/display-time";
import {
  filterValidJumuahSlots,
} from "@/lib/seasonal-client";
import {
  findNextPrayer,
  getActiveJumuahIndex,
  isCombinedMaghribIsha,
  isFardPrayerActive,
  type FardPrayerKey,
  type PrayerTimesResponse,
} from "@/lib/prayer-times-client";
import { FOLLOWS_MAGHRIB_LABEL } from "@/lib/prayer-iqama";

interface PrayerTimesPanelProps {
  schedule: PrayerTimesResponse;
  now?: Date | null;
  variant?: "default" | "landscape";
}

export function PrayerTimesPanel({
  schedule,
  now = null,
  variant = "default",
}: PrayerTimesPanelProps) {
  const effectiveNow = getDisplayEffectiveNow(schedule, now);
  const nextPrayer = findNextPrayer(schedule, effectiveNow);
  const validJumuah = filterValidJumuahSlots(schedule);
  const fridayWithJumuah = schedule.isFriday && validJumuah.length > 0;
  const combinedMaghribIsha = isCombinedMaghribIsha(schedule);

  const isNextFard = (name: string) =>
    nextPrayer?.type === "fard" &&
    nextPrayer.name.toLowerCase() === name.toLowerCase();

  const isActiveFard = (name: FardPrayerKey) =>
    isFardPrayerActive(schedule, name, effectiveNow);

  const activeJumuahIndex =
    fridayWithJumuah && effectiveNow
      ? getActiveJumuahIndex(
          validJumuah,
          effectiveNow,
          schedule.prayers.asr.adhan,
        )
      : null;

  let dhuhrColumn: ReactNode = null;

  if (fridayWithJumuah) {
    dhuhrColumn = (
      <JumuahCard
        slots={validJumuah.map((slot) => ({
          index: slot.index,
          adhan: slot.adhan,
          iqama: slot.iqama,
        }))}
        isNext={nextPrayer?.type === "jumuah"}
        isActive={activeJumuahIndex !== null}
      />
    );
  } else if (!schedule.isFriday) {
    dhuhrColumn = (
      <PrayerCard
        name="Dhuhr"
        adhan={schedule.prayers.dhuhr?.adhan ?? null}
        adhanDisplay={schedule.prayers.dhuhr?.adhanDisplay}
        iqama={schedule.prayers.dhuhr?.iqama ?? null}
        iqamaDisplay={schedule.prayers.dhuhr?.iqamaDisplay}
        isNext={isNextFard("dhuhr")}
        isActive={isActiveFard("dhuhr")}
      />
    );
  }

  const gridClass =
    variant === "landscape"
      ? "display-prayer-times-grid display-prayer-times-grid-landscape"
      : "display-prayer-times-grid display-prayer-times-grid-default";

  if (variant === "landscape") {
    return (
      <section className="display-prayer-times-panel display-landscape-section">
        <div className={gridClass}>
          <PrayerCard
            name="Fajr"
            adhan={schedule.prayers.fajr.adhan}
            adhanDisplay={schedule.prayers.fajr.adhanDisplay}
            iqama={schedule.prayers.fajr.iqama}
            iqamaDisplay={schedule.prayers.fajr.iqamaDisplay}
            isNext={isNextFard("fajr")}
            isActive={isActiveFard("fajr")}
          />

          {dhuhrColumn}

          <PrayerCard
            name="Asr"
            adhan={schedule.prayers.asr.adhan}
            adhanDisplay={schedule.prayers.asr.adhanDisplay}
            iqama={schedule.prayers.asr.iqama}
            iqamaDisplay={schedule.prayers.asr.iqamaDisplay}
            isNext={isNextFard("asr")}
            isActive={isActiveFard("asr")}
          />

          <PrayerCard
            name="Maghrib"
            adhan={schedule.prayers.maghrib.adhan}
            adhanDisplay={schedule.prayers.maghrib.adhanDisplay}
            iqama={schedule.prayers.maghrib.iqama}
            iqamaDisplay={schedule.prayers.maghrib.iqamaDisplay}
            isNext={isNextFard("maghrib")}
            isActive={isActiveFard("maghrib")}
          />

          <PrayerCard
            name="Isha"
            adhan={schedule.prayers.isha.adhan}
            adhanDisplay={schedule.prayers.isha.adhanDisplay}
            iqama={schedule.prayers.isha.iqama}
            iqamaDisplay={schedule.prayers.isha.iqamaDisplay}
            iqamaLabel={
              combinedMaghribIsha
                ? (schedule.prayers.isha.iqamaDisplay ??
                  schedule.prayers.isha.adhanDisplay ??
                  FOLLOWS_MAGHRIB_LABEL)
                : schedule.prayers.isha.iqamaDisplay === FOLLOWS_MAGHRIB_LABEL
                  ? FOLLOWS_MAGHRIB_LABEL
                  : null
            }
            isNext={isNextFard("isha")}
            isActive={isActiveFard("isha")}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="display-prayer-times-panel">
      <div className={gridClass}>
        <PrayerCard
          name="Fajr"
          adhan={schedule.prayers.fajr.adhan}
          adhanDisplay={schedule.prayers.fajr.adhanDisplay}
          iqama={schedule.prayers.fajr.iqama}
          iqamaDisplay={schedule.prayers.fajr.iqamaDisplay}
          isNext={isNextFard("fajr")}
          isActive={isActiveFard("fajr")}
        />

        {dhuhrColumn}

        <PrayerCard
          name="Asr"
          adhan={schedule.prayers.asr.adhan}
          adhanDisplay={schedule.prayers.asr.adhanDisplay}
          iqama={schedule.prayers.asr.iqama}
          iqamaDisplay={schedule.prayers.asr.iqamaDisplay}
          isNext={isNextFard("asr")}
          isActive={isActiveFard("asr")}
        />

        <PrayerCard
          name="Maghrib"
          adhan={schedule.prayers.maghrib.adhan}
          adhanDisplay={schedule.prayers.maghrib.adhanDisplay}
          iqama={schedule.prayers.maghrib.iqama}
          iqamaDisplay={schedule.prayers.maghrib.iqamaDisplay}
          isNext={isNextFard("maghrib")}
          isActive={isActiveFard("maghrib")}
        />

        <PrayerCard
          name="Isha"
          adhan={schedule.prayers.isha.adhan}
          adhanDisplay={schedule.prayers.isha.adhanDisplay}
          iqama={schedule.prayers.isha.iqama}
          iqamaDisplay={schedule.prayers.isha.iqamaDisplay}
          combinedNote={combinedMaghribIsha ? "(Combined with Maghrib)" : null}
          iqamaLabel={
            combinedMaghribIsha
              ? (schedule.prayers.isha.iqamaDisplay ??
                schedule.prayers.isha.adhanDisplay ??
                FOLLOWS_MAGHRIB_LABEL)
              : null
          }
          isNext={isNextFard("isha")}
          isActive={isActiveFard("isha")}
        />
      </div>
    </section>
  );
}

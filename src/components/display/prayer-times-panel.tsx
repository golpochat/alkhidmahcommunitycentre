"use client";

import type { CSSProperties } from "react";
import { PrayerCard } from "@/components/display/prayer-card";
import { filterValidJumuahSlots } from "@/lib/seasonal-client";
import {
  findNextPrayer,
  getJumuahOrdinalLabel,
  type PrayerTimesResponse,
} from "@/lib/prayer-times-client";

interface PrayerTimesPanelProps {
  schedule: PrayerTimesResponse;
}

type PrayerColumn = {
  key: string;
  name: string;
  adhan: string | null;
  iqama: string | null;
  iqamaDisplay?: string | null;
  isNext?: boolean;
};

export function PrayerTimesPanel({ schedule }: PrayerTimesPanelProps) {
  const nextPrayer = findNextPrayer(schedule);
  const validJumuah = filterValidJumuahSlots(schedule);
  const columns: PrayerColumn[] = [];

  const pushColumn = (column: PrayerColumn) => {
    columns.push(column);
  };

  pushColumn({
    key: "fajr",
    name: "Fajr",
    adhan: schedule.prayers.fajr.adhan,
    iqama: schedule.prayers.fajr.iqama,
    iqamaDisplay: schedule.prayers.fajr.iqamaDisplay,
    isNext:
      nextPrayer?.type === "fard" &&
      nextPrayer.name.toLowerCase() === "fajr",
  });

  if (schedule.isFriday && validJumuah.length > 0) {
    for (const slot of validJumuah) {
      pushColumn({
        key: `jumuah-${slot.index}`,
        name: getJumuahOrdinalLabel(slot.index),
        adhan: slot.adhan,
        iqama: slot.iqama,
        isNext:
          nextPrayer?.type === "jumuah" &&
          nextPrayer.name.includes(String(slot.index)),
      });
    }
  } else if (schedule.prayers.dhuhr) {
    pushColumn({
      key: "dhuhr",
      name: "Dhuhr",
      adhan: schedule.prayers.dhuhr.adhan,
      iqama: schedule.prayers.dhuhr.iqama,
      iqamaDisplay: schedule.prayers.dhuhr.iqamaDisplay,
      isNext:
        nextPrayer?.type === "fard" &&
        nextPrayer.name.toLowerCase() === "dhuhr",
    });
  }

  for (const prayer of [
    { key: "asr", name: "Asr", slot: schedule.prayers.asr },
    { key: "maghrib", name: "Maghrib", slot: schedule.prayers.maghrib },
    { key: "isha", name: "Isha", slot: schedule.prayers.isha },
  ]) {
    pushColumn({
      key: prayer.key,
      name: prayer.name,
      adhan: prayer.slot.adhan,
      iqama: prayer.slot.iqama,
      iqamaDisplay: prayer.slot.iqamaDisplay,
      isNext:
        nextPrayer?.type === "fard" &&
        nextPrayer.name.toLowerCase() === prayer.name.toLowerCase(),
    });
  }

  if (schedule.eid.type) {
    for (const slot of schedule.eid.prayers) {
      pushColumn({
        key: `eid-${slot.index}`,
        name: `Eid Prayer ${slot.index}`,
        adhan: slot.adhan,
        iqama: slot.iqama,
        isNext: nextPrayer?.type === "eid",
      });
    }
  }

  return (
    <section className="display-prayer-times-panel">
      <div
        className="display-prayer-times-grid"
        style={
          {
            "--display-prayer-columns": columns.length,
          } as CSSProperties
        }
      >
        {columns.map((column, index) => (
          <PrayerCard
            key={column.key}
            name={column.name}
            adhan={column.adhan}
            iqama={column.iqama}
            iqamaDisplay={column.iqamaDisplay}
            isNext={column.isNext}
            showDivider={index < columns.length - 1}
          />
        ))}
      </div>
    </section>
  );
}

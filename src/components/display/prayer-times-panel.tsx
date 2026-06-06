"use client";

import type { CSSProperties, ReactNode } from "react";
import { JumuahCard } from "@/components/display/jumuah-card";
import { PrayerCard } from "@/components/display/prayer-card";
import {
  filterValidJumuahSlots,
  isBeforeLastJumuah,
} from "@/lib/seasonal-client";
import {
  findNextPrayer,
  isCombinedMaghribIsha,
  type PrayerTimesResponse,
} from "@/lib/prayer-times-client";

interface PrayerTimesPanelProps {
  schedule: PrayerTimesResponse;
  now?: Date;
}

type PanelColumn =
  | {
      key: string;
      kind: "prayer";
      name: string;
      adhan: string | null;
      iqama: string | null;
      iqamaDisplay?: string | null;
      variant?: "default" | "sunrise";
      isNext?: boolean;
    }
  | {
      key: string;
      kind: "jumuah";
      slots: Array<{ index: number; adhan: string | null; iqama: string | null }>;
      isNext?: boolean;
    };

export function PrayerTimesPanel({
  schedule,
  now = new Date(),
}: PrayerTimesPanelProps) {
  const nextPrayer = findNextPrayer(schedule, now);
  const validJumuah = filterValidJumuahSlots(schedule);
  const showJumuah =
    schedule.isFriday &&
    isBeforeLastJumuah(schedule, now) &&
    validJumuah.length > 0;
  const combinedMaghribIsha = isCombinedMaghribIsha(schedule);

  const columns: PanelColumn[] = [
    {
      key: "fajr",
      kind: "prayer",
      name: "Fajr",
      adhan: schedule.prayers.fajr.adhan,
      iqama: schedule.prayers.fajr.iqama,
      iqamaDisplay: schedule.prayers.fajr.iqamaDisplay,
      isNext:
        nextPrayer?.type === "fard" &&
        nextPrayer.name.toLowerCase() === "fajr",
    },
  ];

  if (schedule.sunrise) {
    columns.push({
      key: "sunrise",
      kind: "prayer",
      name: "Sunrise",
      adhan: schedule.sunrise,
      iqama: null,
      variant: "sunrise",
      isNext: nextPrayer?.type === "sunrise",
    });
  }

  if (showJumuah) {
    columns.push({
      key: "jumuah",
      kind: "jumuah",
      slots: validJumuah.map((slot) => ({
        index: slot.index,
        adhan: slot.adhan,
        iqama: slot.iqama,
      })),
      isNext: nextPrayer?.type === "jumuah",
    });
  } else {
    columns.push({
      key: "dhuhr",
      kind: "prayer",
      name: "Dhuhr",
      adhan: schedule.prayers.dhuhr?.adhan ?? null,
      iqama: schedule.prayers.dhuhr?.iqama ?? null,
      iqamaDisplay: schedule.prayers.dhuhr?.iqamaDisplay,
      isNext:
        nextPrayer?.type === "fard" &&
        nextPrayer.name.toLowerCase() === "dhuhr",
    });
  }

  columns.push({
    key: "asr",
    kind: "prayer",
    name: "Asr",
    adhan: schedule.prayers.asr.adhan,
    iqama: schedule.prayers.asr.iqama,
    iqamaDisplay: schedule.prayers.asr.iqamaDisplay,
    isNext:
      nextPrayer?.type === "fard" &&
      nextPrayer.name.toLowerCase() === "asr",
  });

  if (combinedMaghribIsha) {
    columns.push({
      key: "maghrib-isha-combined",
      kind: "prayer",
      name: "Maghrib + Isha (Combined)",
      adhan: schedule.prayers.maghrib.adhan,
      iqama: schedule.prayers.isha.iqama,
      isNext:
        nextPrayer?.type === "fard" &&
        (nextPrayer.name.toLowerCase() === "maghrib" ||
          nextPrayer.name.toLowerCase() === "isha"),
    });
  } else {
    columns.push({
      key: "maghrib",
      kind: "prayer",
      name: "Maghrib",
      adhan: schedule.prayers.maghrib.adhan,
      iqama: schedule.prayers.maghrib.iqama,
      iqamaDisplay: schedule.prayers.maghrib.iqamaDisplay,
      isNext:
        nextPrayer?.type === "fard" &&
        nextPrayer.name.toLowerCase() === "maghrib",
    });

    columns.push({
      key: "isha",
      kind: "prayer",
      name: "Isha",
      adhan: schedule.prayers.isha.adhan,
      iqama: schedule.prayers.isha.iqama,
      iqamaDisplay: schedule.prayers.isha.iqamaDisplay,
      isNext:
        nextPrayer?.type === "fard" &&
        nextPrayer.name.toLowerCase() === "isha",
    });
  }

  const renderColumn = (column: PanelColumn, index: number): ReactNode => {
    const showDivider = index < columns.length - 1;

    if (column.kind === "jumuah") {
      return (
        <JumuahCard
          key={column.key}
          slots={column.slots}
          isNext={column.isNext}
          showDivider={showDivider}
        />
      );
    }

    return (
      <PrayerCard
        key={column.key}
        name={column.name}
        adhan={column.adhan}
        iqama={column.iqama}
        iqamaDisplay={column.iqamaDisplay}
        variant={column.variant}
        isNext={column.isNext}
        showDivider={showDivider}
      />
    );
  };

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
        {columns.map(renderColumn)}
      </div>
    </section>
  );
}

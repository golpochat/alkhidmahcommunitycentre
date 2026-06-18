"use client";

import { getDisplayEffectiveNow } from "@/lib/display-time";
import {
  filterValidJumuahSlots,
  isBeforeLastJumuah,
} from "@/lib/seasonal-client";
import {
  findNextPrayer,
  formatJumuahOrdinal,
  formatPrayerTime24h,
  isCombinedMaghribIsha,
  type JumuahSlot,
  type PrayerTimesResponse,
} from "@/lib/prayer-times-client";
import { FOLLOWS_MAGHRIB_LABEL } from "@/lib/prayer-iqama";

interface DisplayPortraitPrayerTableProps {
  schedule: PrayerTimesResponse;
  now: Date | null;
}

function formatJumuahPortraitSuffix(slots: JumuahSlot[]) {
  const line = [...slots]
    .sort((a, b) => a.index - b.index)
    .map(
      (slot) =>
        `${formatJumuahOrdinal(slot.index)} Jumuah: ${formatPrayerTime24h(slot.adhan)}`,
    )
    .join(", ");

  return line || null;
}

function isNextFard(
  nextPrayer: ReturnType<typeof findNextPrayer>,
  name: string,
) {
  return (
    nextPrayer?.type === "fard" &&
    nextPrayer.name.toLowerCase() === name.toLowerCase()
  );
}

interface PortraitRowProps {
  name: string;
  adhan: string | null;
  adhanDisplay?: string | null;
  iqama?: string | null;
  iqamaLabel?: string | null;
  isActive?: boolean;
  prayerSuffix?: string | null;
}

function PortraitRow({
  name,
  adhan,
  adhanDisplay,
  iqama,
  iqamaLabel,
  isActive,
  prayerSuffix,
}: PortraitRowProps) {
  const adhanLabel = adhanDisplay?.trim() || formatPrayerTime24h(adhan);

  return (
    <div
      className={
        isActive
          ? "display-portrait-table-row display-portrait-table-row-active"
          : "display-portrait-table-row"
      }
    >
      <div className="display-portrait-table-prayer-cell">
        <span className="display-portrait-table-prayer-name">{name}</span>
        {prayerSuffix ? (
          <span className="display-portrait-table-prayer-suffix">
            {prayerSuffix}
          </span>
        ) : null}
      </div>
      <div>{adhanLabel}</div>
      <div>
        {iqamaLabel ? (
          <span className="display-portrait-table-iqama-label">
            {iqamaLabel}
          </span>
        ) : (
          formatPrayerTime24h(iqama ?? null)
        )}
      </div>
    </div>
  );
}

export function DisplayPortraitPrayerTable({
  schedule,
  now,
}: DisplayPortraitPrayerTableProps) {
  const effectiveNow = getDisplayEffectiveNow(schedule, now);
  const nextPrayer = findNextPrayer(schedule, effectiveNow);
  const validJumuah = filterValidJumuahSlots(schedule);
  const showFridayJumuah =
    schedule.isFriday &&
    isBeforeLastJumuah(schedule, effectiveNow) &&
    validJumuah.length > 0;
  const combinedMaghribIsha = isCombinedMaghribIsha(schedule);
  const jumuahNoticeSlots =
    !schedule.isFriday && schedule.configuredJumuah.length > 0
      ? schedule.configuredJumuah
      : [];
  const jumuahSuffix = showFridayJumuah
    ? formatJumuahPortraitSuffix(validJumuah)
    : jumuahNoticeSlots.length > 0
      ? formatJumuahPortraitSuffix(jumuahNoticeSlots)
      : null;

  return (
    <section className="display-portrait-table" aria-label="Prayer times">
      <div className="display-portrait-table-head">
        <div>Prayer</div>
        <div>Adhan</div>
        <div>Iqama</div>
      </div>

      <div className="display-portrait-table-body">
        <PortraitRow
          name="Fajr"
          adhan={schedule.prayers.fajr.adhan}
          adhanDisplay={schedule.prayers.fajr.adhanDisplay}
          iqama={
            schedule.prayers.fajr.iqamaDisplay ?? schedule.prayers.fajr.iqama
          }
          isActive={isNextFard(nextPrayer, "fajr")}
        />

        <PortraitRow
          name="Sunrise"
          adhan={schedule.sunrise}
          isActive={nextPrayer?.type === "sunrise"}
        />

        {showFridayJumuah ? (
          <PortraitRow
            name="Jumu'ah"
            adhan={null}
            iqama={null}
            prayerSuffix={jumuahSuffix}
            isActive={nextPrayer?.type === "jumuah"}
          />
        ) : (
          <PortraitRow
            name="Dhuhr"
            adhan={schedule.prayers.dhuhr?.adhan ?? null}
            adhanDisplay={schedule.prayers.dhuhr?.adhanDisplay}
            iqama={
              schedule.prayers.dhuhr?.iqamaDisplay ??
              schedule.prayers.dhuhr?.iqama ??
              null
            }
            prayerSuffix={jumuahSuffix}
            isActive={isNextFard(nextPrayer, "dhuhr")}
          />
        )}

        <PortraitRow
          name="Asr"
          adhan={schedule.prayers.asr.adhan}
          adhanDisplay={schedule.prayers.asr.adhanDisplay}
          iqama={
            schedule.prayers.asr.iqamaDisplay ?? schedule.prayers.asr.iqama
          }
          isActive={isNextFard(nextPrayer, "asr")}
        />

        <PortraitRow
          name="Maghrib"
          adhan={schedule.prayers.maghrib.adhan}
          adhanDisplay={schedule.prayers.maghrib.adhanDisplay}
          iqama={
            schedule.prayers.maghrib.iqamaDisplay ??
            schedule.prayers.maghrib.iqama
          }
          isActive={isNextFard(nextPrayer, "maghrib")}
        />

        <PortraitRow
          name="Isha"
          adhan={schedule.prayers.isha.adhan}
          adhanDisplay={schedule.prayers.isha.adhanDisplay}
          iqama={
            schedule.prayers.isha.iqamaDisplay ?? schedule.prayers.isha.iqama
          }
          iqamaLabel={
            combinedMaghribIsha
              ? schedule.prayers.isha.iqamaDisplay ??
                schedule.prayers.isha.adhanDisplay ??
                FOLLOWS_MAGHRIB_LABEL
              : schedule.prayers.isha.iqamaDisplay === FOLLOWS_MAGHRIB_LABEL
                ? FOLLOWS_MAGHRIB_LABEL
                : null
          }
          isActive={isNextFard(nextPrayer, "isha")}
        />
      </div>
    </section>
  );
}

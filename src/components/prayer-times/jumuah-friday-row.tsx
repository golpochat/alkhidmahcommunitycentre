"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  formatPrayerTime24h,
  getActiveJumuahIndex,
  getJumuahOrdinalLabel,
  getJumuahPrayerLabel,
  type JumuahSlot,
  type NextPrayer,
} from "@/lib/prayer-times-client";
import { cn } from "@/lib/utils";

interface JumuahFridayRowProps {
  jumuah: JumuahSlot[];
  nextPrayer: NextPrayer | null;
  asrAdhan?: string | null;
}

function jumuahSlotsKey(slots: JumuahSlot[]) {
  return slots.map((slot) => `${slot.index}:${slot.adhan ?? ""}`).join("|");
}

export function JumuahFridayRow({
  jumuah,
  nextPrayer,
  asrAdhan,
}: JumuahFridayRowProps) {
  const sorted = useMemo(
    () => [...jumuah].sort((a, b) => a.index - b.index),
    [jumuah]
  );
  const slotsKey = useMemo(() => jumuahSlotsKey(sorted), [sorted]);
  const sortedRef = useRef(sorted);
  sortedRef.current = sorted;
  const asrAdhanRef = useRef(asrAdhan);
  asrAdhanRef.current = asrAdhan;

  const [activeIndex, setActiveIndex] = useState<number | null>(() =>
    getActiveJumuahIndex(sorted, new Date(), asrAdhan)
  );

  useEffect(() => {
    setActiveIndex(
      getActiveJumuahIndex(sortedRef.current, new Date(), asrAdhanRef.current)
    );
  }, [slotsKey, asrAdhan]);

  useEffect(() => {
    const syncActiveJumuah = () => {
      setActiveIndex(
        getActiveJumuahIndex(sortedRef.current, new Date(), asrAdhanRef.current)
      );
    };

    const interval = setInterval(syncActiveJumuah, 30_000);
    return () => clearInterval(interval);
  }, [slotsKey, asrAdhan]);

  const isNext = sorted.some(
    (slot) =>
      nextPrayer && nextPrayer.name === getJumuahPrayerLabel(slot.index)
  );

  if (sorted.length === 0) return null;

  return (
    <TableRow
      className={cn(
        "prayer-times-table-row",
        isNext && "prayer-times-table-row-next"
      )}
    >
      <TableCell className="prayer-times-table-cell prayer-times-table-cell-name">
        Jumu&apos;ah
      </TableCell>
      <TableCell className="prayer-times-table-cell jumuah-friday-adhan-cell text-right">
        <div className="jumuah-friday-adhan-list">
          {sorted.map((slot) => {
            const isActive = activeIndex !== null && slot.index === activeIndex;

            return (
              <p
                key={slot.index}
                className={cn(
                  "jumuah-friday-adhan-line",
                  isActive && "jumuah-friday-adhan-line-active"
                )}
              >
                <span className="jumuah-friday-adhan-label">
                  {getJumuahOrdinalLabel(slot.index)}:
                </span>
                <span className="jumuah-friday-adhan-time">
                  {formatPrayerTime24h(slot.adhan)}
                </span>
              </p>
            );
          })}
        </div>
      </TableCell>
      <TableCell className="prayer-times-table-cell jumuah-friday-iqama-cell text-right">
        <div className="jumuah-friday-iqama-list">
          {sorted.map((slot) => {
            const isActive = activeIndex !== null && slot.index === activeIndex;

            return (
              <p
                key={slot.index}
                className={cn(
                  "jumuah-friday-iqama-line",
                  isActive && "jumuah-friday-iqama-line-active"
                )}
              >
                <span className="jumuah-friday-iqama-time">
                  {formatPrayerTime24h(slot.iqama ?? slot.adhan)}
                </span>
              </p>
            );
          })}
        </div>
      </TableCell>
    </TableRow>
  );
}

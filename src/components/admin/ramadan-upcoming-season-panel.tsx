"use client";

import type { KeyboardEvent, MouseEvent } from "react";
import { format, parseISO } from "date-fns";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  RAMADAN_START_DAY_OFFSET_MAX,
  RAMADAN_START_DAY_OFFSET_MIN,
  type UpcomingRamadanSeasonInfo,
} from "@/lib/ramadan-season-types";
import { normalizeRamadanStartDayOffset } from "@/lib/ramadan-settings-types";

interface RamadanUpcomingSeasonPanelProps {
  season: UpcomingRamadanSeasonInfo;
  disabled?: boolean;
  onConfigChange: (patch: {
    startDayOffset?: number;
    isThirtyDayMonth?: boolean;
  }) => void;
}

function RamadanLengthSlider({
  isThirtyDayMonth,
  disabled,
  onChange,
}: {
  isThirtyDayMonth: boolean;
  disabled?: boolean;
  onChange: (isThirtyDayMonth: boolean) => void;
}) {
  function handleTrackClick(event: MouseEvent<HTMLButtonElement>) {
    if (disabled) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    onChange(event.clientX - rect.left > rect.width / 2);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) {
      return;
    }

    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      onChange(true);
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      onChange(false);
    }
  }

  return (
    <button
      type="button"
      className="admin-ramadan-length-slider-track"
      disabled={disabled}
      role="slider"
      aria-valuemin={29}
      aria-valuemax={30}
      aria-valuenow={isThirtyDayMonth ? 30 : 29}
      aria-label="Ramadan length in days"
      onClick={handleTrackClick}
      onKeyDown={handleKeyDown}
    >
      <span
        className="admin-ramadan-length-slider-thumb"
        data-position={isThirtyDayMonth ? "30" : "29"}
        aria-hidden="true"
      />
      <span
        className={cn(
          "admin-ramadan-length-slider-option",
          !isThirtyDayMonth && "admin-ramadan-length-slider-option--active"
        )}
      >
        29 days
      </span>
      <span
        className={cn(
          "admin-ramadan-length-slider-option",
          isThirtyDayMonth && "admin-ramadan-length-slider-option--active"
        )}
      >
        30 days
      </span>
    </button>
  );
}

export function RamadanUpcomingSeasonPanel({
  season,
  disabled,
  onConfigChange,
}: RamadanUpcomingSeasonPanelProps) {
  function setOffset(nextOffset: number) {
    onConfigChange({
      startDayOffset: normalizeRamadanStartDayOffset(nextOffset),
    });
  }

  const startDate = format(parseISO(season.calculatedStartDate), "d MMM yyyy");

  return (
    <div className="admin-ramadan-upcoming-toolbar">
      <div className="admin-ramadan-upcoming-item admin-ramadan-upcoming-item--start">
        <Label className="admin-ramadan-upcoming-item-label">
          Possible Ramadan starting date
        </Label>
        <div className="admin-ramadan-upcoming-control-shell admin-ramadan-upcoming-start-value">
          <span className="admin-ramadan-upcoming-item-value">{startDate}</span>
        </div>
      </div>

      <div className="admin-ramadan-upcoming-item">
        <Label
          htmlFor="ramadan-start-offset"
          className="admin-ramadan-upcoming-item-label"
        >
          Adjust days
        </Label>
        <div className="admin-ramadan-upcoming-control-shell admin-ramadan-upcoming-adjust-controls">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="admin-ramadan-upcoming-step"
            disabled={
              disabled || season.startDayOffset <= RAMADAN_START_DAY_OFFSET_MIN
            }
            onClick={() => setOffset(season.startDayOffset - 1)}
            aria-label="Move Ramadan start one day earlier"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            id="ramadan-start-offset"
            value={String(season.startDayOffset)}
            readOnly
            className="admin-ramadan-upcoming-offset-input"
            aria-label="Ramadan start day adjustment"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="admin-ramadan-upcoming-step"
            disabled={
              disabled || season.startDayOffset >= RAMADAN_START_DAY_OFFSET_MAX
            }
            onClick={() => setOffset(season.startDayOffset + 1)}
            aria-label="Move Ramadan start one day later"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="admin-ramadan-upcoming-item admin-ramadan-upcoming-item--length">
        <Label className="admin-ramadan-upcoming-item-label">Ramadan length</Label>
        <div className="admin-ramadan-upcoming-control-shell admin-ramadan-upcoming-length-control">
          <RamadanLengthSlider
            isThirtyDayMonth={season.isThirtyDayMonth}
            disabled={disabled}
            onChange={(isThirtyDayMonth) =>
              onConfigChange({ isThirtyDayMonth })
            }
          />
        </div>
      </div>
    </div>
  );
}

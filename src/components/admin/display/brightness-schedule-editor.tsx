"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  defaultBrightnessPeriods,
  formatBrightnessPercent,
  type BrightnessPeriod,
} from "@/lib/display-brightness";

interface BrightnessScheduleEditorProps {
  value: BrightnessPeriod[];
  onChange: (value: BrightnessPeriod[]) => void;
}

export function BrightnessScheduleEditor({
  value,
  onChange,
}: BrightnessScheduleEditorProps) {
  const periods = value.length > 0 ? value : defaultBrightnessPeriods();

  function updatePeriod(index: number, patch: Partial<BrightnessPeriod>) {
    onChange(
      periods.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    );
  }

  function removePeriod(index: number) {
    if (periods.length <= 1) return;
    onChange(periods.filter((_, itemIndex) => itemIndex !== index));
  }

  function addPeriod() {
    onChange([
      ...periods,
      { from: "00:00", to: "06:00", brightnessPercent: 60 },
    ]);
  }

  return (
    <div className="admin-brightness-editor space-y-4">
      <div>
        <Label>Brightness schedule</Label>
        <p className="mt-1 text-sm text-muted-foreground">
          Set screen brightness for different times of day. Useful for dimming the
          TV during evening prayers.
        </p>
      </div>

      <div className="space-y-3">
        {periods.map((period, index) => (
          <div key={`${period.from}-${period.to}-${index}`} className="admin-brightness-row">
            <div className="admin-brightness-row-times">
              <div className="space-y-1">
                <Label htmlFor={`brightness-from-${index}`} className="text-xs">
                  From
                </Label>
                <Input
                  id={`brightness-from-${index}`}
                  type="time"
                  value={period.from}
                  onChange={(event) =>
                    updatePeriod(index, { from: event.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`brightness-to-${index}`} className="text-xs">
                  To
                </Label>
                <Input
                  id={`brightness-to-${index}`}
                  type="time"
                  value={period.to}
                  onChange={(event) =>
                    updatePeriod(index, { to: event.target.value })
                  }
                />
              </div>
            </div>

            <div className="admin-brightness-row-slider space-y-1">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor={`brightness-level-${index}`} className="text-xs">
                  Brightness
                </Label>
                <span className="text-sm font-medium text-gold">
                  {formatBrightnessPercent(period.brightnessPercent)}
                </span>
              </div>
              <input
                id={`brightness-level-${index}`}
                type="range"
                min={20}
                max={100}
                step={5}
                value={period.brightnessPercent}
                onChange={(event) =>
                  updatePeriod(index, {
                    brightnessPercent: Number(event.target.value),
                  })
                }
                className="admin-brightness-slider"
              />
            </div>

            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              onClick={() => removePeriod(index)}
              disabled={periods.length <= 1}
              aria-label="Remove brightness period"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={addPeriod}>
        <Plus className="mr-2 h-4 w-4" />
        Add time period
      </Button>
    </div>
  );
}

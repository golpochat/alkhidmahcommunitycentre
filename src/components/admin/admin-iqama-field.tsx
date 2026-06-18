"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getIntervalTextValue,
  type DailyPrayerKey,
  type IqamaMode,
  type PrayerIqamaConfig,
} from "@/lib/prayer-iqama";

interface AdminIqamaFieldProps {
  prayer: DailyPrayerKey;
  disabled?: boolean;
  config: PrayerIqamaConfig;
  legacyIqama?: string;
  onChange: (config: PrayerIqamaConfig) => void;
}

const MODE_OPTIONS: Array<{ value: IqamaMode; label: string }> = [
  { value: "fixed", label: "Fixed" },
  { value: "interval", label: "Interval" },
  { value: "text", label: "Custom text" },
];

export function AdminIqamaField({
  prayer,
  disabled = false,
  config,
  legacyIqama = "",
  onChange,
}: AdminIqamaFieldProps) {
  const modeOptions =
    prayer === "isha"
      ? [
          { value: "fixed" as const, label: "Fixed" },
          { value: "interval" as const, label: "Interval" },
          { value: "follows_magrib" as const, label: "After Maghrib" },
          { value: "text" as const, label: "Custom text" },
        ]
      : MODE_OPTIONS;

  const modeLabel =
    modeOptions.find((option) => option.value === config.mode)?.label ??
    "Iqama type";

  function updateConfig(partial: Partial<PrayerIqamaConfig>) {
    onChange({ ...config, ...partial });
  }

  return (
    <div className="admin-iqama-field">
      <Select
        disabled={disabled}
        value={config.mode}
        onValueChange={(value) =>
          updateConfig({
            mode: value as IqamaMode,
            fixed:
              value === "fixed"
                ? legacyIqama || config.fixed || ""
                : config.fixed,
            intervalText:
              value === "interval"
                ? getIntervalTextValue(config)
                : config.intervalText,
            text:
              value === "text" ? config.text || legacyIqama || "" : config.text,
          })
        }
      >
        <SelectTrigger className="admin-iqama-field-mode">
          <SelectValue placeholder="Iqama type">{modeLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {modeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {config.mode === "fixed" && (
        <Input
          type="time"
          disabled={disabled}
          className="admin-iqama-field-value admin-iqama-field-fixed-time"
          value={config.fixed || legacyIqama || ""}
          onChange={(event) => updateConfig({ fixed: event.target.value })}
        />
      )}

      {config.mode === "interval" && (
        <Input
          disabled={disabled}
          className="admin-iqama-field-value"
          placeholder="Minutes after adhan (e.g. 15)"
          value={getIntervalTextValue(config)}
          onChange={(event) =>
            updateConfig({ intervalText: event.target.value })
          }
        />
      )}

      {config.mode === "text" && (
        <Input
          disabled={disabled}
          className="admin-iqama-field-value admin-iqama-field-text"
          placeholder="e.g. After Maghrib"
          value={config.text || ""}
          onChange={(event) => updateConfig({ text: event.target.value })}
        />
      )}
    </div>
  );
}

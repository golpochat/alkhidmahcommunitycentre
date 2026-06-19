"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrayerTime24h } from "@/lib/prayer-times-client";
import {
  defaultAdhanConfigEntry,
  resolveAdhan,
  resolveAdhanDisplay,
  type AdhanMode,
  type PrayerAdhanConfig,
} from "@/lib/prayer-adhan";

interface AdminAdhanApiTimeProps {
  apiAdhan: string;
}

export function AdminAdhanApiTime({ apiAdhan }: AdminAdhanApiTimeProps) {
  return (
    <p className="admin-adhan-api-time">{formatPrayerTime24h(apiAdhan)}</p>
  );
}

interface AdminAdhanFieldProps {
  apiAdhan: string;
  config: PrayerAdhanConfig;
  disabled?: boolean;
  onChange: (config: PrayerAdhanConfig) => void;
}

const MODE_OPTIONS: Array<{ value: AdhanMode; label: string }> = [
  { value: "offset", label: "Interval" },
  { value: "fixed", label: "Fixed" },
  { value: "text", label: "Custom text" },
];

export function AdminAdhanField({
  apiAdhan,
  config,
  disabled = false,
  onChange,
}: AdminAdhanFieldProps) {
  const resolvedAdhan = resolveAdhan(apiAdhan, config);
  const resolvedDisplay = resolveAdhanDisplay(apiAdhan, config);
  const mode = config?.mode ?? "offset";
  const modeLabel =
    MODE_OPTIONS.find((option) => option.value === mode)?.label ?? "Adhan type";

  function updateConfig(partial: Partial<PrayerAdhanConfig>) {
    onChange({ ...(config ?? defaultAdhanConfigEntry()), ...partial });
  }

  return (
    <div className="admin-adhan-field">
      <Select
        disabled={disabled}
        value={mode}
        onValueChange={(value) =>
          updateConfig({
            mode: value as AdhanMode,
            fixed:
              value === "fixed"
                ? config.fixed || resolvedAdhan || ""
                : config.fixed,
            text: value === "text" ? config.text || "" : config.text,
          })
        }
      >
        <SelectTrigger className="admin-adhan-field-mode">
          <SelectValue placeholder="Adhan type">{modeLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {MODE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {mode === "offset" ? (
        <Input
          type="number"
          step={1}
          disabled={disabled}
          className="admin-adhan-field-value admin-adhan-field-offset"
          value={String(config?.offsetMinutes ?? 0)}
          onChange={(event) => {
            const raw = event.target.value.trim();
            const parsed = raw === "" || raw === "-" ? 0 : Number(raw);

            updateConfig({
              offsetMinutes: Number.isFinite(parsed) ? Math.trunc(parsed) : 0,
            });
          }}
        />
      ) : mode === "fixed" ? (
        <Input
          type="time"
          disabled={disabled}
          className="admin-adhan-field-value admin-adhan-field-fixed-time"
          value={config.fixed || ""}
          onChange={(event) => updateConfig({ fixed: event.target.value })}
        />
      ) : (
        <Input
          disabled={disabled}
          className="admin-adhan-field-value admin-adhan-field-text"
          placeholder="e.g. After Maghrib"
          value={config.text || ""}
          onChange={(event) => updateConfig({ text: event.target.value })}
        />
      )}

      {mode === "offset" && (
        <span className="admin-adhan-shown-time">
          {formatPrayerTime24h(resolvedAdhan)}
        </span>
      )}

      {mode === "text" && resolvedDisplay && (
        <span className="admin-adhan-shown-time">{resolvedDisplay}</span>
      )}
    </div>
  );
}

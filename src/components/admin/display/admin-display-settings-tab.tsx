"use client";

import { Loader2 } from "lucide-react";
import { BrightnessScheduleEditor } from "@/components/admin/display/brightness-schedule-editor";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  brightnessPeriodsFromStorage,
  brightnessPeriodsToStorage,
  type BrightnessPeriod,
} from "@/lib/display-brightness";
import {
  isWeatherEnabled,
  type SerializedDisplaySettings,
} from "@/lib/display-settings-types";

export interface DisplaySettingsFormState {
  rotationSpeed: number;
  showWeather: boolean;
  pinCode: string;
  orientationOverride: SerializedDisplaySettings["orientationOverride"];
  autoFullscreen: boolean;
  brightnessPeriods: BrightnessPeriod[];
}

export function settingsToForm(
  settings: SerializedDisplaySettings,
): DisplaySettingsFormState {
  return {
    rotationSpeed: settings.rotationSpeed,
    showWeather: isWeatherEnabled(settings.enabledPanels),
    pinCode: settings.pinCode ?? "",
    orientationOverride: settings.orientationOverride,
    autoFullscreen: settings.autoFullscreen,
    brightnessPeriods: brightnessPeriodsFromStorage(settings.brightnessSchedule),
  };
}

export function formToSavePayload(form: DisplaySettingsFormState) {
  return {
    rotationSpeed: form.rotationSpeed,
    showWeather: form.showWeather,
    pinCode: form.pinCode.trim() || null,
    orientationOverride: form.orientationOverride,
    autoFullscreen: form.autoFullscreen,
    brightnessSchedule: brightnessPeriodsToStorage(form.brightnessPeriods),
  };
}

interface AdminDisplaySettingsTabProps {
  form: DisplaySettingsFormState;
  saving: boolean;
  loading: boolean;
  onChange: (form: DisplaySettingsFormState) => void;
  onSave: () => void;
}

export function AdminDisplaySettingsTab({
  form,
  saving,
  loading,
  onChange,
  onSave,
}: AdminDisplaySettingsTabProps) {
  if (loading) {
    return (
      <div className="admin-display-loading">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="admin-prayer-times-tab-section">
      <div className="admin-prayer-times-tab-header">
        <div>
          <h2 className="admin-prayer-times-tab-title">Display settings</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            TV behaviour only — prayer times are managed under Special Prayers.
          </p>
        </div>
      </div>

      <div className="admin-display-card">
        <div className="admin-display-card-body">
          <div className="admin-display-settings-grid">
            <div className="space-y-2">
              <Label htmlFor="rotation-speed">Rotation speed (seconds)</Label>
              <Input
                id="rotation-speed"
                type="number"
                min={5}
                max={120}
                value={form.rotationSpeed}
                onChange={(event) =>
                  onChange({
                    ...form,
                    rotationSpeed: Number(event.target.value),
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Default duration for ayat slides and messages without their own
                duration.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Screen orientation</Label>
              <Select
                value={form.orientationOverride ?? "auto"}
                onValueChange={(value) => {
                  if (!value) return;
                  onChange({
                    ...form,
                    orientationOverride:
                      value === "auto"
                        ? null
                        : (value as "landscape" | "portrait"),
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (detect from screen)</SelectItem>
                  <SelectItem value="landscape">Landscape</SelectItem>
                  <SelectItem value="portrait">Portrait</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin-code">PIN code (optional)</Label>
              <Input
                id="pin-code"
                value={form.pinCode}
                onChange={(event) =>
                  onChange({ ...form, pinCode: event.target.value })
                }
                maxLength={8}
                placeholder="Leave blank to disable"
              />
            </div>

            <label className="admin-display-checkbox-row">
              <Checkbox
                checked={form.showWeather}
                onCheckedChange={(checked) =>
                  onChange({ ...form, showWeather: checked === true })
                }
              />
              <span>Show weather on TV</span>
            </label>

            <label className="admin-display-checkbox-row admin-display-settings-span-full">
              <Checkbox
                checked={form.autoFullscreen}
                onCheckedChange={(checked) =>
                  onChange({ ...form, autoFullscreen: checked === true })
                }
              />
              <span>Auto full screen on load</span>
            </label>

            <div className="admin-display-settings-span-full">
              <BrightnessScheduleEditor
                value={form.brightnessPeriods}
                onChange={(brightnessPeriods) =>
                  onChange({ ...form, brightnessPeriods })
                }
              />
            </div>
          </div>

          <Button className="mt-6" onClick={onSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save settings
          </Button>
        </div>
      </div>
    </div>
  );
}

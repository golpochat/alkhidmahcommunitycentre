"use client";

import { useEffect, useState } from "react";
import { Loader2, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseJsonResponse } from "@/lib/parse-json-response";
import type { RamadanSeasonInfo } from "@/lib/ramadan-season-types";

interface RamadanMoonSightingPanelProps {
  year: number | null;
  season: RamadanSeasonInfo | null;
  disabled?: boolean;
  onSeasonUpdated: (season: RamadanSeasonInfo) => void;
}

export function RamadanMoonSightingPanel({
  year,
  season,
  disabled,
  onSeasonUpdated,
}: RamadanMoonSightingPanelProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (!season) return;
    setStartDate(season.startDate);
    setEndDate(season.endDate);
  }, [season]);

  const isDirty =
    season != null &&
    (startDate !== season.startDate || endDate !== season.endDate);

  const matchesCalculated =
    season != null &&
    startDate === season.calculatedStartDate &&
    endDate === season.calculatedEndDate;

  async function handleSave() {
    if (year == null || !startDate || !endDate) return;
    setSaving(true);
    try {
      const response = await fetch("/api/ramadan/season", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, startDate, endDate }),
      });
      const data = await parseJsonResponse<{
        error?: string;
        season?: RamadanSeasonInfo;
      }>(response);
      if (!response.ok) throw new Error(data.error || "Save failed");
      if (data.season) {
        onSeasonUpdated(data.season);
      }
      toast.success(
        matchesCalculated
          ? "Using calculated Ramadan dates"
          : "Moon sighting dates saved. Fill from daily prayer times to refresh the timetable.",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (year == null) return;
    setResetting(true);
    try {
      const response = await fetch("/api/ramadan/season", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, reset: true }),
      });
      const data = await parseJsonResponse<{
        error?: string;
        season?: RamadanSeasonInfo;
      }>(response);
      if (!response.ok) throw new Error(data.error || "Reset failed");
      if (data.season) {
        onSeasonUpdated(data.season);
      }
      toast.success("Reset to calculated Ramadan dates");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Reset failed");
    } finally {
      setResetting(false);
    }
  }

  if (year == null || !season?.calculatedStartDate) {
    return null;
  }

  return (
    <>
      <div className="admin-ramadan-settings-field admin-ramadan-season-settings-start">
        <Label htmlFor="ramadan-moon-start">Ramadan starts</Label>
        <Input
          id="ramadan-moon-start"
          type="date"
          value={startDate}
          disabled={disabled || saving || resetting}
          onChange={(event) => setStartDate(event.target.value)}
        />
      </div>
      <div className="admin-ramadan-settings-field admin-ramadan-season-settings-end">
        <Label htmlFor="ramadan-moon-end">Ramadan ends</Label>
        <Input
          id="ramadan-moon-end"
          type="date"
          value={endDate}
          disabled={disabled || saving || resetting}
          onChange={(event) => setEndDate(event.target.value)}
        />
      </div>
      <div className="admin-ramadan-season-settings-actions">
        <Button
          type="button"
          variant="outline"
          disabled={disabled || saving || resetting || !isDirty}
          onClick={handleSave}
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save moon sighting dates
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={
            disabled ||
            saving ||
            resetting ||
            (!season.isMoonSightingOverride && matchesCalculated)
          }
          onClick={handleReset}
        >
          {resetting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RotateCcw className="mr-2 h-4 w-4" />
          )}
          Use calculated dates
        </Button>
      </div>
    </>
  );
}

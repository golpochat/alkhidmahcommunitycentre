"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileDown, Loader2, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";
import { RamadanMoonSightingPanel } from "@/components/admin/ramadan-moon-sighting-panel";
import { RamadanNotes } from "@/components/ramadan/RamadanNotes";
import { RamadanPaymentQR } from "@/components/ramadan/RamadanPaymentQR";
import {
  RamadanTable,
  type RamadanTableRow,
} from "@/components/ramadan/RamadanTable";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { downloadPdfFromResponse } from "@/lib/download-pdf-blob";
import { parseJsonResponse } from "@/lib/parse-json-response";
import type {
  RamadanSeasonInfo,
  RamadanSeasonSelectOption,
} from "@/lib/ramadan-season-types";
import {
  EMPTY_RAMADAN_SETTINGS,
  mergePaymentQrSlots,
  type RamadanDonationCategoryOption,
  type RamadanPaymentQRItem,
  type RamadanSettingsData,
} from "@/lib/ramadan-settings-types";

interface RamadanRow extends RamadanTableRow {
  taraweeh: string;
  notes: string;
  isCommunityIftar: boolean;
}

export function AdminRamadanTimetableTab() {
  const [seasonOptions, setSeasonOptions] = useState<
    RamadanSeasonSelectOption[]
  >([]);
  const [year, setYear] = useState<number | null>(null);
  const [seasonInfo, setSeasonInfo] = useState<RamadanSeasonInfo | null>(null);
  const [rows, setRows] = useState<RamadanRow[]>([]);
  const [settings, setSettings] = useState<RamadanSettingsData>(
    EMPTY_RAMADAN_SETTINGS,
  );
  const [paymentQrs, setPaymentQrs] = useState<RamadanPaymentQRItem[]>([]);
  const [categories, setCategories] = useState<RamadanDonationCategoryOption[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingQr, setSavingQr] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const pdfPreviewRef = useRef<HTMLDivElement>(null);

  const loadSeasonOptions = useCallback(async () => {
    try {
      const response = await fetch("/api/ramadan/season-options");
      const data = await parseJsonResponse<{
        error?: string;
        options?: RamadanSeasonSelectOption[];
      }>(response);
      if (!response.ok) {
        throw new Error(data.error || "Failed to load Ramadan seasons");
      }
      const options = data.options ?? [];
      setSeasonOptions(options);
      const current =
        options.find((option) => option.role === "current") ?? options[0];
      if (current) {
        setYear(current.hijriYear);
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load Ramadan season list",
      );
    }
  }, []);

  useEffect(() => {
    loadSeasonOptions();
  }, [loadSeasonOptions]);

  const loadData = useCallback(async () => {
    if (year == null) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/ramadan/get?year=${year}`);
      const data = await parseJsonResponse<{
        error?: string;
        season?: RamadanSeasonInfo;
        rows?: RamadanRow[];
        settings?: RamadanSettingsData;
        paymentQrs?: RamadanPaymentQRItem[];
        categories?: RamadanDonationCategoryOption[];
      }>(response);
      if (!response.ok) throw new Error(data.error || "Failed to load");
      const nextSettings = data.settings ?? EMPTY_RAMADAN_SETTINGS;
      if (data.season) {
        setSeasonInfo(data.season);
      }
      setRows(data.rows ?? []);
      setSettings(nextSettings);
      setPaymentQrs(
        mergePaymentQrSlots(data.paymentQrs ?? [], nextSettings.qrSlotCount),
      );
      setCategories(data.categories ?? []);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load Ramadan timetable",
      );
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function updateRow(index: number, patch: Partial<RamadanRow>) {
    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    );
  }

  function updateSettings(patch: Partial<RamadanSettingsData>) {
    setSettings((current) => ({ ...current, ...patch }));
  }

  function handleSeasonChange(hijriYear: number) {
    setYear(hijriYear);
  }

  const selectedSeason =
    seasonOptions.find((option) => option.hijriYear === year) ?? null;

  async function persistTimetable(options?: {
    successMessage?: string;
    settingsOverride?: Partial<RamadanSettingsData>;
  }) {
    if (year == null) return;
    const payloadSettings = options?.settingsOverride
      ? { ...settings, ...options.settingsOverride }
      : settings;
    const response = await fetch("/api/ramadan/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        year,
        rows,
        settings: payloadSettings,
      }),
    });
    const data = await parseJsonResponse<{
      error?: string;
      rows?: RamadanRow[];
      settings?: RamadanSettingsData;
    }>(response);
    if (!response.ok) throw new Error(data.error || "Save failed");
    setRows(data.rows ?? rows);
    if (data.settings) {
      setSettings(data.settings);
    } else if (options?.settingsOverride) {
      setSettings((current) => ({ ...current, ...options.settingsOverride }));
    }
    toast.success(options?.successMessage ?? "Ramadan timetable saved");
  }

  async function handleGenerate() {
    if (year == null) return;
    setGenerating(true);
    try {
      const response = await fetch("/api/ramadan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year }),
      });
      const data = await parseJsonResponse<{
        error?: string;
        rows?: RamadanRow[];
      }>(response);
      if (!response.ok) throw new Error(data.error || "Generation failed");
      setRows(data.rows ?? []);
      toast.success(
        "Ramadan timetable filled using your daily prayer times (modified adhan where set).",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (year == null) return;
    setSaving(true);
    try {
      await persistTimetable();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveNotes(latestNotes: string) {
    if (year == null) return;
    setSavingNotes(true);
    try {
      await persistTimetable({
        successMessage: "Ramadan notes saved",
        settingsOverride: { notesMessage: latestNotes },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSavingNotes(false);
    }
  }

  async function handleSaveQr() {
    if (year == null) return;
    setSavingQr(true);
    try {
      const response = await fetch("/api/ramadan/qr/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year,
          qrSlotCount: settings.qrSlotCount,
          items: paymentQrs,
        }),
      });
      const data = await parseJsonResponse<{
        error?: string;
        items?: RamadanPaymentQRItem[];
        slotCount?: RamadanSettingsData["qrSlotCount"];
      }>(response);
      if (!response.ok) throw new Error(data.error || "Save failed");
      const nextSlotCount = data.slotCount ?? settings.qrSlotCount;
      if (data.slotCount) {
        setSettings((current) => ({
          ...current,
          qrSlotCount: data.slotCount!,
        }));
      }
      if (data.items) {
        setPaymentQrs(mergePaymentQrSlots(data.items, nextSlotCount));
      }
      toast.success("QR settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSavingQr(false);
    }
  }

  async function handlePdfPreview() {
    if (year == null) return;
    setGeneratingPdf(true);
    try {
      const response = await fetch("/api/ramadan/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year }),
      });
      const pdfYear = selectedSeason?.endDate?.slice(0, 4) ?? String(year);
      const { url, filename } = await downloadPdfFromResponse(
        response,
        `ramadan-timetable-${pdfYear}.pdf`,
      );
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
      setPdfPreviewUrl(url);
      pdfPreviewRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      toast.success(`Downloaded ${filename}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "PDF failed");
    } finally {
      setGeneratingPdf(false);
    }
  }

  return (
    <div className="admin-prayer-times-tab-section space-y-6">
      <div className="rounded-lg border border-border bg-secondary/20 p-4">
        <div className="admin-ramadan-season-settings-grid">
          <div className="admin-ramadan-settings-field admin-ramadan-season-settings-season">
            <Label>Ramadan season</Label>
            {year != null && seasonOptions.length > 0 ? (
              <Select
                value={String(year)}
                onValueChange={(value) => handleSeasonChange(Number(value))}
              >
                <SelectTrigger className="w-full">
                  <span className="truncate">
                    {selectedSeason?.label ?? String(year)}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {seasonOptions.map((option) => (
                    <SelectItem
                      key={option.hijriYear}
                      value={String(option.hijriYear)}
                    >
                      <span className="flex flex-col gap-0.5 text-left">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex h-9 w-full items-center rounded-md border border-border bg-background px-3 text-sm text-muted-foreground">
                Loading seasons…
              </div>
            )}
          </div>
          <RamadanMoonSightingPanel
            year={year}
            season={seasonInfo}
            disabled={loading}
            onSeasonUpdated={setSeasonInfo}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={generating || loading || year == null}
          onClick={handleGenerate}
        >
          {generating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Fill from daily prayer times
        </Button>
        <Button
          type="button"
          className="btn-gold"
          disabled={saving || rows.length === 0 || year == null}
          onClick={handleSave}
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save timetable
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={rows.length === 0 || generatingPdf || year == null}
          onClick={handlePdfPreview}
        >
          {generatingPdf ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="mr-2 h-4 w-4" />
          )}
          Generate Ramadan Timetable PDF
        </Button>
      </div>

      {pdfPreviewUrl && (
        <div
          ref={pdfPreviewRef}
          className="rounded-lg border border-border bg-secondary/20 p-4"
        >
          <p className="font-medium text-gold">PDF preview</p>
          <div className="mt-4 space-y-3">
            <object
              data={pdfPreviewUrl}
              type="application/pdf"
              title="Ramadan PDF preview"
              className="h-[520px] w-full rounded-md border border-border bg-white"
            >
              <p className="p-4 text-sm text-muted-foreground">
                Preview unavailable in this browser. Use the download link
                below.
              </p>
            </object>
            <a
              href={pdfPreviewUrl}
              download={`ramadan-timetable-${selectedSeason?.endDate?.slice(0, 4) ?? year}.pdf`}
              className="inline-flex items-center gap-2 text-sm text-gold hover:underline"
            >
              <FileDown className="h-4 w-4" />
              Download PDF again
            </a>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      ) : (
        <div className="w-full space-y-6">
          <RamadanNotes
            value={settings.notesMessage}
            onChange={(value) => updateSettings({ notesMessage: value })}
            onSave={handleSaveNotes}
            saving={savingNotes}
            disabled={rows.length === 0}
          />
          <RamadanPaymentQR
            categories={categories}
            settings={settings}
            items={paymentQrs}
            onSettingsChange={updateSettings}
            onItemsChange={setPaymentQrs}
            onSave={handleSaveQr}
            saving={savingQr}
            disabled={rows.length === 0}
          />
          <RamadanTable rows={rows} onUpdateRow={updateRow} />
        </div>
      )}
    </div>
  );
}

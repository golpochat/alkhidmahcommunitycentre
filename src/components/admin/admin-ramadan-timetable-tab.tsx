"use client";

import { useCallback, useState } from "react";
import { FileDown, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AdminHomepagePublishPanel } from "@/components/admin/admin-homepage-publish-panel";
import { useTimetableHomePublishOverview } from "@/hooks/use-timetable-home-publish-overview";
import { RamadanUpcomingSeasonPanel } from "@/components/admin/ramadan-upcoming-season-panel";
import { RamadanNotes } from "@/components/ramadan/RamadanNotes";
import { RamadanPaymentQR } from "@/components/ramadan/RamadanPaymentQR";
import {
  RamadanTable,
  type RamadanTableRow,
} from "@/components/ramadan/RamadanTable";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { openPdfInNewTabFromResponse } from "@/lib/download-pdf-blob";
import { parseJsonResponse } from "@/lib/parse-json-response";
import { notifyTimetableHomePublishChanged } from "@/lib/timetable-home-publish-events";
import type { UpcomingRamadanSeasonInfo } from "@/lib/ramadan-season-types";
import {
  EMPTY_RAMADAN_SETTINGS,
  mergePaymentQrSlots,
  RAMADAN_QR_MAX_SLOTS,
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
  const [year, setYear] = useState<number | null>(null);
  const [season, setSeason] = useState<UpcomingRamadanSeasonInfo | null>(null);
  const [rows, setRows] = useState<RamadanRow[]>([]);
  const [settings, setSettings] = useState<RamadanSettingsData>(
    EMPTY_RAMADAN_SETTINGS,
  );
  const [paymentQrs, setPaymentQrs] = useState<RamadanPaymentQRItem[]>([]);
  const [categories, setCategories] = useState<RamadanDonationCategoryOption[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [updatingConfig, setUpdatingConfig] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingQr, setSavingQr] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [publishSaving, setPublishSaving] = useState(false);
  const { overview } = useTimetableHomePublishOverview();

  const loadData = useCallback(async (options?: { silent?: boolean }) => {
    setLoading(true);
    try {
      const response = await fetch("/api/ramadan/upcoming");
      const data = await parseJsonResponse<{
        error?: string;
        year?: number;
        season?: UpcomingRamadanSeasonInfo;
        rows?: RamadanRow[];
        settings?: RamadanSettingsData;
        paymentQrs?: RamadanPaymentQRItem[];
        categories?: RamadanDonationCategoryOption[];
      }>(response);

      if (!response.ok) {
        throw new Error(data.error || "Failed to load upcoming Ramadan");
      }

      const nextSettings = data.settings ?? EMPTY_RAMADAN_SETTINGS;
      setYear(data.year ?? null);
      setSeason(data.season ?? null);
      setRows(data.rows ?? []);
      setSettings(nextSettings);
      setPaymentQrs(
        mergePaymentQrSlots(data.paymentQrs ?? [], RAMADAN_QR_MAX_SLOTS),
      );
      setCategories(data.categories ?? []);
      setHasLoaded(true);

      if (!options?.silent) {
        toast.success("Ramadan timetable loaded");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load Ramadan timetable",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleLoad() {
    await loadData();
  }

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

  async function handleConfigChange(patch: {
    startDayOffset?: number;
    isThirtyDayMonth?: boolean;
  }) {
    setUpdatingConfig(true);
    try {
      const response = await fetch("/api/ramadan/upcoming", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await parseJsonResponse<{
        error?: string;
        year?: number;
        season?: UpcomingRamadanSeasonInfo;
        rows?: RamadanRow[];
        settings?: RamadanSettingsData;
      }>(response);

      if (!response.ok) {
        throw new Error(data.error || "Failed to update Ramadan settings");
      }

      if (data.year != null) setYear(data.year);
      if (data.season) setSeason(data.season);
      if (data.rows) setRows(data.rows);
      if (data.settings) setSettings(data.settings);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
      await loadData({ silent: true });
    } finally {
      setUpdatingConfig(false);
    }
  }

  async function persistTimetable(options?: {
    successMessage?: string;
    settingsOverride?: Partial<RamadanSettingsData>;
    showToast?: boolean;
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
    if (options?.showToast !== false && options?.successMessage) {
      toast.success(options.successMessage);
    }
  }

  async function handleGenerateTimetable() {
    if (year == null) return;
    setGeneratingPdf(true);
    try {
      await persistTimetable({ showToast: false });
      const response = await fetch("/api/ramadan/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year }),
      });
      const pdfYear = season?.endDate.slice(0, 4) ?? String(year);
      const { filename } = await openPdfInNewTabFromResponse(
        response,
        `ramadan-timetable-${pdfYear}.pdf`,
      );
      toast.success(
        `Ramadan timetable saved. Opened ${filename} in a new tab.`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "PDF failed");
    } finally {
      setGeneratingPdf(false);
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
          qrSlotCount: RAMADAN_QR_MAX_SLOTS,
          items: paymentQrs,
        }),
      });
      const data = await parseJsonResponse<{
        error?: string;
        items?: RamadanPaymentQRItem[];
      }>(response);
      if (!response.ok) throw new Error(data.error || "Save failed");
      if (data.items) {
        setPaymentQrs(mergePaymentQrSlots(data.items, RAMADAN_QR_MAX_SLOTS));
      }
      toast.success("QR settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSavingQr(false);
    }
  }

  const configDisabled = loading || updatingConfig || generatingPdf;

  async function handleHomePublishChange(published: boolean) {
    setPublishSaving(true);
    try {
      const response = await fetch("/api/ramadan/home-publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published }),
      });
      const data = await parseJsonResponse<{ error?: string; published?: boolean }>(
        response,
      );
      if (!response.ok) {
        throw new Error(data.error || "Failed to update homepage visibility");
      }

      notifyTimetableHomePublishChanged();
      toast.success(
        published
          ? "Ramadan timetable published on the homepage"
          : "Ramadan timetable hidden from the homepage",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update homepage visibility",
      );
    } finally {
      setPublishSaving(false);
    }
  }

  const isRamadanPublished = overview.ramadan.published;
  const isLiveOnHomepage =
    isRamadanPublished && overview.sectionVisible;
  const ramadanBadge = isLiveOnHomepage
    ? "Live on homepage"
    : isRamadanPublished
      ? "Published — section hidden"
      : "Hidden from homepage";

  return (
    <div className="admin-prayer-times-tab-section space-y-6">
      <AdminHomepagePublishPanel
        title="Ramadan timetable"
        description="Controls the Ramadan PDF download button in the homepage prayer timetables section."
        checked={isRamadanPublished}
        badgeLabel={ramadanBadge}
        badgeTone={isLiveOnHomepage ? "live" : isRamadanPublished ? "warning" : "muted"}
        statusDetail={
          isLiveOnHomepage
            ? year
              ? `Visitors can download the Ramadan ${year} timetable on the homepage.`
              : "Visitors can download the active Ramadan timetable on the homepage."
            : isRamadanPublished
              ? "Ramadan is published, but the master section switch is currently off."
              : "The Ramadan download link is hidden on the homepage."
        }
        saving={publishSaving}
        publishDisabled={!hasLoaded || rows.length === 0}
        onCheckedChange={(published) => void handleHomePublishChange(published)}
      />

      <Tabs defaultValue="timetable" className="admin-prayer-times-tabs">
        <TabsList variant="line" className="admin-prayer-times-tabs-list">
          <TabsTrigger value="timetable">Timetable</TabsTrigger>
          <TabsTrigger value="notes">Add Message</TabsTrigger>
          <TabsTrigger value="qr">Add QR codes</TabsTrigger>
        </TabsList>

        <TabsContent
          value="timetable"
          className="admin-prayer-times-tab-content"
        >
          <div className="admin-ramadan-timetable-toolbar">
            {hasLoaded && season ? (
              <RamadanUpcomingSeasonPanel
                season={season}
                disabled={configDisabled}
                onConfigChange={handleConfigChange}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Click Load to fetch the upcoming Ramadan season and timetable.
              </p>
            )}

            <div className="admin-ramadan-timetable-toolbar-actions">
              <Button
                type="button"
                variant="outline"
                className="admin-ramadan-load-button"
                disabled={loading || generatingPdf || updatingConfig}
                onClick={handleLoad}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Load
              </Button>
              <Button
                type="button"
                className="btn-gold admin-ramadan-generate-button"
                disabled={
                  !hasLoaded ||
                  rows.length === 0 ||
                  generatingPdf ||
                  loading ||
                  year == null
                }
                onClick={handleGenerateTimetable}
              >
                {generatingPdf ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="mr-2 h-4 w-4" />
                )}
                Generate Ramadan Timetable
              </Button>
            </div>
          </div>

          <RamadanTable rows={rows} onUpdateRow={updateRow} />
        </TabsContent>

        <TabsContent value="notes" className="admin-prayer-times-tab-content">
          <RamadanNotes
            value={settings.notesMessage}
            onChange={(value) => updateSettings({ notesMessage: value })}
            onSave={handleSaveNotes}
            saving={savingNotes}
            disabled={!hasLoaded || rows.length === 0}
          />
        </TabsContent>

        <TabsContent value="qr" className="admin-prayer-times-tab-content">
          <RamadanPaymentQR
            categories={categories}
            items={paymentQrs}
            onItemsChange={setPaymentQrs}
            onSave={handleSaveQr}
            saving={savingQr}
            disabled={!hasLoaded || rows.length === 0}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

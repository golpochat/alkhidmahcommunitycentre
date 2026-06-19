"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Download, FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AdminHomepagePublishPanel } from "@/components/admin/admin-homepage-publish-panel";
import { useTimetableHomePublishOverview } from "@/hooks/use-timetable-home-publish-overview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { openPdfInNewTabFromResponse } from "@/lib/download-pdf-blob";
import { parseJsonResponse } from "@/lib/parse-json-response";
import { notifyTimetableHomePublishChanged } from "@/lib/timetable-home-publish-events";
import { parseDateKey } from "@/lib/prayer-times-pure";

interface MonthlyRow {
  date: string;
  dayName: string;
  fajrAdhan: string;
  fajrIqama: string;
  sunrise: string;
  dhuhrAdhan: string;
  dhuhrIqama: string;
  asrAdhan: string;
  asrIqama: string;
  maghribAdhan: string;
  maghribIqama: string;
  ishaAdhan: string;
  ishaIqama: string;
  notes: string;
  isFriday: boolean;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function EditableCell({
  value,
  onChange,
  type = "text",
}: {
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  const inputType =
    type === "time" && /^\d{2}:\d{2}$/.test(value) ? "time" : "text";

  return (
    <Input
      type={inputType}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-8 min-w-[68px] border-border bg-background px-2 text-xs"
    />
  );
}

export function AdminMonthlyTimetableTab() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const yearOptions = [currentYear, currentYear + 1];
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [rows, setRows] = useState<MonthlyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [publishSaving, setPublishSaving] = useState(false);
  const { overview } = useTimetableHomePublishOverview();

  useEffect(() => {
    setRows([]);
    setHasLoaded(false);
  }, [month, year]);

  function updateRow(index: number, patch: Partial<MonthlyRow>) {
    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    );
  }

  async function handleLoad() {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/monthly/generate?month=${month}&year=${year}`,
      );
      const data = await parseJsonResponse<{
        error?: string;
        rows?: MonthlyRow[];
      }>(response);
      if (!response.ok) throw new Error(data.error || "Load failed");
      setRows(data.rows ?? []);
      setHasLoaded(true);
      toast.success("Monthly timetable loaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateMonthlyTimetable() {
    setGeneratingPdf(true);
    try {
      const response = await fetch("/api/monthly/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year }),
      });
      const { filename } = await openPdfInNewTabFromResponse(
        response,
        `prayer-timetable-${year}-${String(month).padStart(2, "0")}.pdf`,
      );
      toast.success(`Opened ${filename} in a new tab.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "PDF failed");
    } finally {
      setGeneratingPdf(false);
    }
  }

  async function handleHomePublishChange(published: boolean) {
    setPublishSaving(true);
    try {
      const response = await fetch("/api/monthly/home-publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month,
          year,
          published,
          rows: published ? rows : undefined,
        }),
      });
      const data = await parseJsonResponse<{
        error?: string;
        published?: boolean;
        month?: number | null;
        year?: number | null;
      }>(response);
      if (!response.ok) {
        throw new Error(data.error || "Failed to update homepage visibility");
      }

      notifyTimetableHomePublishChanged();
      toast.success(
        published
          ? "Monthly timetable published on the homepage"
          : "Monthly timetable hidden from the homepage",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update homepage visibility",
      );
    } finally {
      setPublishSaving(false);
    }
  }

  const publishedMonth = overview.monthly.month;
  const publishedYear = overview.monthly.year;
  const isPublishedForSelection =
    overview.monthly.published &&
    publishedMonth === month &&
    publishedYear === year;
  const isLiveOnHomepage =
    isPublishedForSelection && overview.sectionVisible;

  const publishedLabel =
    publishedMonth && publishedYear
      ? format(new Date(publishedYear, publishedMonth - 1, 1), "MMMM yyyy")
      : "No month selected";

  const monthlyBadge = isLiveOnHomepage
    ? "Live on homepage"
    : isPublishedForSelection
      ? "Published — section hidden"
      : overview.monthly.published
        ? `Published for ${publishedLabel}`
        : "Hidden from homepage";

  return (
    <div className="admin-prayer-times-tab-section space-y-6">
      <AdminHomepagePublishPanel
        title="Monthly timetable"
        description="Controls the monthly PDF download button in the homepage prayer timetables section."
        checked={isPublishedForSelection}
        badgeLabel={monthlyBadge}
        badgeTone={
          isLiveOnHomepage ? "live" : isPublishedForSelection ? "warning" : "muted"
        }
        statusDetail={
          isLiveOnHomepage
            ? `Visitors can download the ${format(new Date(year, month - 1, 1), "MMMM yyyy")} timetable.`
            : isPublishedForSelection
              ? "This month is published, but the master section switch is currently off."
              : overview.monthly.published && publishedLabel !== "No month selected"
                ? `${publishedLabel} is published. Load ${format(new Date(year, month - 1, 1), "MMMM yyyy")} and publish to replace it.`
                : "The monthly download link is hidden on the homepage."
        }
        saving={publishSaving}
        publishDisabled={!hasLoaded || rows.length === 0}
        onCheckedChange={(published) => void handleHomePublishChange(published)}
      />
      {/* <div className="admin-prayer-times-tab-header">
        <div>
          <h2 className="admin-prayer-times-tab-title">
            Monthly Prayer Timetable (Full Month View)
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Times are loaded from daily prayer settings for the selected month.
            Override any field before generating the PDF.
          </p>
        </div>
      </div> */}

      <div className="admin-monthly-timetable-toolbar">
        <div className="admin-monthly-timetable-field">
          <Label htmlFor="monthly-timetable-month">Month</Label>
          <Select
            value={String(month)}
            onValueChange={(value) => setMonth(Number(value))}
          >
            <SelectTrigger id="monthly-timetable-month" className="w-full">
              <span>{MONTHS[month - 1]}</span>
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((label, index) => (
                <SelectItem key={label} value={String(index + 1)}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="admin-monthly-timetable-field">
          <Label htmlFor="monthly-timetable-year">Year</Label>
          <Select
            value={String(year)}
            onValueChange={(value) => setYear(Number(value))}
          >
            <SelectTrigger id="monthly-timetable-year" className="w-full">
              <span>{year}</span>
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          variant="outline"
          className="admin-monthly-load-button"
          disabled={loading || generatingPdf}
          onClick={handleLoad}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Load
        </Button>

        <Button
          type="button"
          className="btn-gold admin-monthly-generate-button"
          disabled={rows.length === 0 || loading || generatingPdf || !hasLoaded}
          onClick={handleGenerateMonthlyTimetable}
        >
          {generatingPdf ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="mr-2 h-4 w-4" />
          )}
          Generate Monthly Prayer Timetable
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      ) : !hasLoaded ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Select a month and year, then click Load to view the timetable.
        </p>
      ) : (
        <div className="admin-prayer-times-table-wrap overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Fajr Adhan</TableHead>
                <TableHead>Fajr Iqama</TableHead>
                <TableHead>Sunrise</TableHead>
                <TableHead>Dhuhr Adhan</TableHead>
                <TableHead>Dhuhr Iqama</TableHead>
                <TableHead>Asr Adhan</TableHead>
                <TableHead>Asr Iqama</TableHead>
                <TableHead>Maghrib Adhan</TableHead>
                <TableHead>Maghrib Iqama</TableHead>
                <TableHead>Isha Adhan</TableHead>
                <TableHead>Isha Iqama</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow
                  key={row.date}
                  className={cn(row.isFriday && "bg-gold/10")}
                >
                  <TableCell className="whitespace-nowrap text-xs">
                    {format(parseDateKey(row.date), "d MMM")}
                  </TableCell>
                  <TableCell className="text-xs">
                    {format(parseDateKey(row.date), "EEEE")}
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={row.fajrAdhan}
                      onChange={(v) => updateRow(index, { fajrAdhan: v })}
                      type="time"
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={row.fajrIqama}
                      onChange={(v) => updateRow(index, { fajrIqama: v })}
                      type="time"
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={row.sunrise}
                      onChange={(v) => updateRow(index, { sunrise: v })}
                      type="time"
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={row.dhuhrAdhan}
                      onChange={(v) => updateRow(index, { dhuhrAdhan: v })}
                      type="time"
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={row.dhuhrIqama}
                      onChange={(v) => updateRow(index, { dhuhrIqama: v })}
                      type="time"
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={row.asrAdhan}
                      onChange={(v) => updateRow(index, { asrAdhan: v })}
                      type="time"
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={row.asrIqama}
                      onChange={(v) => updateRow(index, { asrIqama: v })}
                      type="time"
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={row.maghribAdhan}
                      onChange={(v) => updateRow(index, { maghribAdhan: v })}
                      type="time"
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={row.maghribIqama}
                      onChange={(v) => updateRow(index, { maghribIqama: v })}
                      type="time"
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={row.ishaAdhan}
                      onChange={(v) => updateRow(index, { ishaAdhan: v })}
                      type="time"
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={row.ishaIqama}
                      onChange={(v) => updateRow(index, { ishaIqama: v })}
                      type="time"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

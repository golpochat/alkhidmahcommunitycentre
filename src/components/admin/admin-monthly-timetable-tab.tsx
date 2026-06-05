"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { FileDown, Loader2, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";
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
import { parseJsonResponse } from "@/lib/parse-json-response";
import { downloadPdfFromResponse } from "@/lib/download-pdf-blob";

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
  return (
    <Input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-8 min-w-[68px] border-border bg-background px-2 text-xs"
    />
  );
}

export function AdminMonthlyTimetableTab() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [rows, setRows] = useState<MonthlyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const pdfPreviewRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/monthly/generate?month=${month}&year=${year}`,
      );
      const data = await parseJsonResponse<{
        error?: string;
        rows?: MonthlyRow[];
      }>(response);
      if (!response.ok) throw new Error(data.error || "Failed to load");
      setRows(data.rows ?? []);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load monthly timetable",
      );
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function updateRow(index: number, patch: Partial<MonthlyRow>) {
    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    );
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const response = await fetch("/api/monthly/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year }),
      });
      const data = await parseJsonResponse<{
        error?: string;
        rows?: MonthlyRow[];
      }>(response);
      if (!response.ok) throw new Error(data.error || "Generation failed");
      setRows(data.rows ?? []);
      toast.success("Monthly timetable filled from daily prayer times");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const response = await fetch("/api/monthly/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year, rows }),
      });
      const data = await parseJsonResponse<{
        error?: string;
        rows?: MonthlyRow[];
      }>(response);
      if (!response.ok) throw new Error(data.error || "Save failed");
      setRows(data.rows ?? []);
      toast.success("Monthly timetable saved and published to homepage");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handlePdfPreview() {
    setGeneratingPdf(true);
    try {
      const response = await fetch("/api/monthly/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year }),
      });
      const { url, filename } = await downloadPdfFromResponse(
        response,
        `prayer-timetable-${year}-${String(month).padStart(2, "0")}.pdf`,
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
      <div className="admin-prayer-times-tab-header">
        <div>
          <h2 className="admin-prayer-times-tab-title">
            Monthly Prayer Timetable (Full Month View)
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate a full month with Adhan and Iqama times. Override any field
            before saving.
          </p>
        </div>
      </div>

      <details
        className="rounded-lg border border-border bg-secondary/20 p-4"
        open
      >
        <summary className="cursor-pointer font-medium text-gold">
          Month selector
        </summary>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Month</Label>
            <Select
              value={String(month)}
              onValueChange={(value) => setMonth(Number(value))}
            >
              <SelectTrigger className="w-full">
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
          <div className="space-y-2">
            <Label>Year</Label>
            <Select
              value={String(year)}
              onValueChange={(value) => setYear(Number(value))}
            >
              <SelectTrigger className="w-full">
                <span>{year}</span>
              </SelectTrigger>
              <SelectContent>
                {[2025, 2026, 2027, 2028, 2029].map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </details>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={generating || loading}
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
          disabled={saving || rows.length === 0}
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
          disabled={rows.length === 0 || generatingPdf}
          onClick={handlePdfPreview}
        >
          {generatingPdf ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="mr-2 h-4 w-4" />
          )}
          Generate Monthly Prayer Timetable PDF
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
              title="Monthly PDF preview"
              className="h-[520px] w-full rounded-md border border-border bg-white"
            >
              <p className="p-4 text-sm text-muted-foreground">
                Preview unavailable in this browser. Use the download link
                below.
              </p>
            </object>
            <a
              href={pdfPreviewUrl}
              download={`prayer-timetable-${year}-${String(month).padStart(2, "0")}.pdf`}
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
        <details className="rounded-lg border border-border" open>
          <summary className="cursor-pointer px-4 py-3 font-medium">
            Month view table
          </summary>
          <div className="admin-prayer-times-table-wrap overflow-x-auto p-4 pt-0">
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
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow
                    key={row.date}
                    className={cn(row.isFriday && "bg-gold/10")}
                  >
                    <TableCell className="whitespace-nowrap text-xs">
                      {format(parseISO(row.date), "d MMM")}
                    </TableCell>
                    <TableCell className="text-xs">{row.dayName}</TableCell>
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
                    <TableCell>
                      <EditableCell
                        value={row.notes}
                        onChange={(v) => updateRow(index, { notes: v })}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </details>
      )}
    </div>
  );
}
